import type { BannerOptions, BackgroundPreset } from './types.js';
import { escapeXml } from '../utils/sanitize.js';
import {
  detectBackgroundTheme,
  parseHeaderWithIcons,
  renderSegmentsAsHTML,
} from './icons.js';

const WIDTH = 1280;
const HEIGHT = 304;
const MARGIN = 50;
const MAX_CONTENT_WIDTH = WIDTH - MARGIN * 2;
const BASE_FONT_SIZE = 192;
const MIN_FONT_SIZE = 24;
const CHAR_WIDTH_RATIO = 0.65; // More conservative for wide characters like 'A'
const SPACE_WIDTH_RATIO = 0.25;
const EMOJI_WIDTH_RATIO = 1.3; // Emojis need more space for proper rendering

function buildGradientDef(bg: BackgroundPreset): string {
  if (!bg.stops) return '';
  const stops = bg.stops
    .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`)
    .join('');
  return `<linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`;
}

function buildBackground(bg: BackgroundPreset): string {
  if (bg.type === 'transparent') {
    return `<rect width="${WIDTH}" height="${HEIGHT}" fill="none" />`;
  }
  const fill =
    bg.type === 'gradient' ? 'url(#bg-gradient)' : bg.color ?? '#f3f4f6';
  return `<rect width="${WIDTH}" height="${HEIGHT}" fill="${fill}" />`;
}

function buildWatermark(position: string = 'bottom-right'): string {
  const text = 'ghrb.waren.build';
  const fontSize = 16;
  const rectPaddingX = 8;
  const rectPaddingY = 6;
  const textWidth = text.length * fontSize * 0.55;
  const rectWidth = textWidth + rectPaddingX * 2;
  const rectHeight = fontSize + rectPaddingY * 2;
  
  // Calculate position based on parameter
  let rectX: number;
  let rectY: number;
  let textAnchor: string;
  let textXOffset: number;
  
  switch (position) {
    case 'top-left':
      rectX = 0;
      rectY = 0;
      textAnchor = 'start';
      textXOffset = rectX + rectPaddingX;
      break;
    case 'top-right':
      rectX = WIDTH - rectWidth;
      rectY = 0;
      textAnchor = 'end';
      textXOffset = rectX + rectPaddingX + textWidth;
      break;
    case 'bottom-left':
      rectX = 0;
      rectY = HEIGHT - rectHeight;
      textAnchor = 'start';
      textXOffset = rectX + rectPaddingX;
      break;
    case 'bottom-right':
    default:
      rectX = WIDTH - rectWidth;
      rectY = HEIGHT - rectHeight;
      textAnchor = 'end';
      textXOffset = rectX + rectPaddingX + textWidth;
      break;
  }
  
  const textY = rectY + rectPaddingY + fontSize * 0.8;

  return `<g opacity="0.6">
  <rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" fill="#000000" fill-opacity="0.3" />
  <text x="${textXOffset}" y="${textY}" text-anchor="${textAnchor}" font-family="monospace, sans-serif" font-size="${fontSize}" font-weight="500" fill="#f5f5f5">${text}</text>
</g>`;
}

/**
 * Fetch a font file and return it as a base64 data URI.
 */
async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  // Determine MIME type from URL
  const mime = url.includes('.woff2')
    ? 'font/woff2'
    : url.includes('.woff')
      ? 'font/woff'
      : url.includes('.ttf')
        ? 'font/ttf'
        : 'application/octet-stream';
  return `data:${mime};base64,${base64}`;
}

/**
 * Fetch and embed Google Fonts CSS with inlined font data directly in SVG.
 * Font files are fetched and converted to base64 data URIs so the SVG
 * is fully self-contained and works in contexts that block external resources
 * (e.g., GitHub README img tags, PNG conversion).
 * Note: Font names are already sanitized in the route handler
 */
async function buildGoogleFontsStyle(headerFont?: string, subheaderFont?: string): Promise<string> {
  const fonts = new Set<string>();
  if (headerFont) fonts.add(headerFont);
  if (subheaderFont) fonts.add(subheaderFont);

  if (fonts.size === 0) return '';

  try {
    // Build Google Fonts URL with weights for better rendering
    const fontFamilies = Array.from(fonts)
      .map(font => `family=${encodeURIComponent(font)}:wght@400;700`)
      .join('&');

    const fontUrl = `https://fonts.googleapis.com/css2?${fontFamilies}&display=swap`;

    // Fetch the CSS with a browser User-Agent to get woff2 format (smaller files)
    const response = await fetch(fontUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (!response.ok) {
      return '';
    }

    let css = await response.text();

    // Extract all external font url() references and replace with inline base64 data URIs
    // This makes the SVG self-contained so fonts work everywhere
    const urlPattern = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
    const matches = [...css.matchAll(urlPattern)];

    if (matches.length > 0) {
      // Deduplicate URLs (same font file may appear multiple times)
      const uniqueUrls = [...new Set(matches.map(m => m[1]))];

      // Fetch all unique font files in parallel
      const urlToDataUri = new Map<string, string>();
      const results = await Promise.allSettled(
        uniqueUrls.map(async (url) => {
          const dataUri = await fetchFontAsBase64(url);
          urlToDataUri.set(url, dataUri);
        })
      );

      // Log any failures
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error('Failed to inline font file:', uniqueUrls[i], result.reason);
        }
      });

      // Replace all external URLs with their base64 data URIs
      css = css.replace(urlPattern, (_match, url) => {
        const dataUri = urlToDataUri.get(url);
        return dataUri ? `url(${dataUri})` : `url(${url})`;
      });
    }

    return `<style>${css}</style>`;
  } catch (error) {
    // If fetch fails, gracefully fallback to no custom fonts
    console.error('Google Fonts error:', error);
    return '';
  }
}

/**
 * Estimate text width for font sizing decisions.
 * Properly accounts for emojis and icons which render wider than text.
 */
function estimateTextWidth(text: string, fontSize: number): number {
  // Regex to detect emojis (including multi-codepoint sequences)
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;
  // Regex to detect icons: ![slug] or ![slug](theme)
  const iconRegex = /!\[([a-z0-9-]+)\](?:\((light|dark|auto)\))?/g;

  // Count icons and emojis to add their width
  const iconCount = (text.match(iconRegex) || []).length;
  const emojiCount = (text.match(emojiRegex) || []).length;

  // Remove icons and emojis from text for accurate character width calculation
  let cleanText = text.replace(iconRegex, '').replace(emojiRegex, '');

  let width = 0;

  // Calculate width of regular text
  for (const ch of cleanText) {
    width += fontSize * (ch === ' ' ? SPACE_WIDTH_RATIO : CHAR_WIDTH_RATIO);
  }

  // Add width for icons and emojis
  // Each icon/emoji is rendered as fontSize width + 0.2em margin (0.1em on each side)
  // EMOJI_WIDTH_RATIO already accounts for the visual size, add extra for margins
  const marginWidth = fontSize * 0.2; // 0.1em on each side
  width += (iconCount + emojiCount) * (fontSize * EMOJI_WIDTH_RATIO + marginWidth);

  return width;
}

/**
 * Compute the font size that fits within MAX_CONTENT_WIDTH.
 */
function fitFontSize(text: string, baseSize: number): number {
  const widthAtBase = estimateTextWidth(text, baseSize);
  if (widthAtBase <= MAX_CONTENT_WIDTH) return baseSize;
  // Add 10% safety margin to prevent overflow, especially with emojis
  const scaled = baseSize * (MAX_CONTENT_WIDTH / (widthAtBase * 1.1));
  return Math.max(MIN_FONT_SIZE, Math.round(scaled));
}

export async function buildBannerSVG(options: BannerOptions): Promise<string> {
  const {
    header,
    subheader,
    background,
    textColor,
    subheaderColor,
    fontFamily,
    headerFont,
    subheaderFont,
    showWatermark = false,
    watermarkPosition = 'bottom-right',
  } = options;

  const hasSubheader = !!subheader;

  const headerFontSize = fitFontSize(header, BASE_FONT_SIZE);
  const subBaseFontSize = hasSubheader ? Math.round(headerFontSize * 0.4) : 0;
  const subFontSize = hasSubheader ? fitFontSize(subheader!, subBaseFontSize) : 0;

  const VERTICAL_PAD = 50; // Always maintain top/bottom padding
  const availableHeight = HEIGHT - VERTICAL_PAD * 2;

  // Vertical scaling for subheader layout
  let effHeaderSize = headerFontSize;
  let effSubSize = subFontSize;
  let effGap = hasSubheader ? Math.round(subFontSize * 1.0) : 0; // Increased from 0.6 to 1.0 for more spacing

  if (hasSubheader) {
    const totalHeight = headerFontSize + effGap + subFontSize;
    if (totalHeight > availableHeight) {
      const scale = availableHeight / totalHeight;
      effHeaderSize = Math.round(headerFontSize * scale);
      effSubSize = Math.round(subFontSize * scale);
      effGap = Math.round(effGap * scale);
    }
  }

  const defs = buildGradientDef(background);
  const bgRect = buildBackground(background);
  const watermark = showWatermark ? buildWatermark(watermarkPosition) : '';
  
  // Determine font families to use - Google Font if specified, otherwise default
  // Escape the font names for safe insertion into CSS
  const headerFontFamily = headerFont 
    ? `'${escapeXml(headerFont)}', ${fontFamily}`
    : fontFamily;
  
  const subheaderFontFamily = subheaderFont
    ? `'${escapeXml(subheaderFont)}', ${fontFamily}`
    : fontFamily;
  
  // Fetch and embed Google Fonts CSS if needed
  const googleFontsStyle = await buildGoogleFontsStyle(headerFont, subheaderFont);

  // Detect background theme for auto icon coloring
  const backgroundTheme = detectBackgroundTheme(background);

  // Parse header and subheader into segments (text, emoji, icons)
  const headerSegments = parseHeaderWithIcons(header);
  const subheaderSegments = hasSubheader
    ? parseHeaderWithIcons(subheader!)
    : [];

  // Use foreignObject with HTML — browser renders text + emoji + icons natively
  const subColorValue = subheaderColor || textColor;

  // Render segments as HTML with inline images for emoji and icons
  const headerHTML = await renderSegmentsAsHTML(
    headerSegments,
    effHeaderSize,
    textColor,
    backgroundTheme,
  );

  const subheaderHTML = hasSubheader
    ? await renderSegmentsAsHTML(
        subheaderSegments,
        effSubSize,
        subColorValue,
        backgroundTheme,
      )
    : '';

  const htmlContent = hasSubheader
    ? `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${WIDTH}px;height:${HEIGHT}px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${VERTICAL_PAD}px ${MARGIN}px;box-sizing:border-box;">
  ${googleFontsStyle}
  <div style="font-family:${escapeXml(headerFontFamily)};font-size:${effHeaderSize}px;font-weight:700;color:${textColor};line-height:1;text-align:center;white-space:nowrap;">${headerHTML}</div>
  <div style="font-family:${escapeXml(subheaderFontFamily)};font-size:${effSubSize}px;font-weight:400;color:${subColorValue};line-height:1;text-align:center;white-space:nowrap;margin-top:${effGap}px;">${subheaderHTML}</div>
</div>`
    : `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${WIDTH}px;height:${HEIGHT}px;display:flex;align-items:center;justify-content:center;padding:0 ${MARGIN}px;box-sizing:border-box;">
  ${googleFontsStyle}
  <div style="font-family:${escapeXml(headerFontFamily)};font-size:${effHeaderSize}px;font-weight:700;color:${textColor};line-height:1;text-align:center;white-space:nowrap;">${headerHTML}</div>
</div>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>${defs}</defs>
${bgRect}
<foreignObject x="0" y="0" width="${WIDTH}" height="${HEIGHT}">
${htmlContent}
</foreignObject>
${watermark}
</svg>`;
}
