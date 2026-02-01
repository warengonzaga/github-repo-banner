import type { BannerOptions, BackgroundPreset } from './types.js';
import { escapeXml } from '../utils/sanitize.js';

const WIDTH = 1280;
const HEIGHT = 304;
const MARGIN = 100;
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

function buildWatermark(): string {
  const text = 'made with ghrb.waren.build';
  const fontSize = 16;
  const rectPaddingX = 8;
  const rectPaddingY = 6;
  const textWidth = text.length * fontSize * 0.55;
  const rectWidth = textWidth + rectPaddingX * 2;
  const rectHeight = fontSize + rectPaddingY * 2;
  const rectX = WIDTH - rectWidth;
  const rectY = HEIGHT - rectHeight;
  const textX = rectX + rectPaddingX + textWidth;
  const textY = rectY + rectPaddingY + fontSize * 0.8;

  return `<g opacity="0.6">
  <rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" fill="#000000" fill-opacity="0.3" />
  <text x="${textX}" y="${textY}" text-anchor="end" font-family="monospace, sans-serif" font-size="${fontSize}" font-weight="500" fill="#f5f5f5">${text}</text>
</g>`;
}

/**
 * Fetch and embed Google Fonts CSS directly in SVG
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
    
    console.log('Fetching Google Fonts:', fontUrl);
    
    // Fetch the CSS from Google Fonts
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.error('Google Fonts fetch failed:', response.status);
      return '';
    }
    
    const css = await response.text();
    console.log('Google Fonts CSS length:', css.length);
    return `<style>${css}</style>`;
  } catch (error) {
    // If fetch fails, gracefully fallback to no custom fonts
    console.error('Google Fonts error:', error);
    return '';
  }
}

/**
 * Estimate text width for font sizing decisions.
 * Properly accounts for emojis which render wider than text.
 */
function estimateTextWidth(text: string, fontSize: number): number {
  // Regex to detect emojis (including multi-codepoint sequences)
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;
  
  let width = 0;
  let lastIndex = 0;
  
  // Process emojis
  for (const match of text.matchAll(emojiRegex)) {
    // Add text before this emoji
    if (match.index! > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index!);
      for (const ch of textBefore) {
        width += fontSize * (ch === ' ' ? SPACE_WIDTH_RATIO : CHAR_WIDTH_RATIO);
      }
    }
    
    // Add emoji width
    width += fontSize * EMOJI_WIDTH_RATIO;
    lastIndex = match.index! + match[0].length;
  }
  
  // Add remaining text after last emoji
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    for (const ch of remainingText) {
      width += fontSize * (ch === ' ' ? SPACE_WIDTH_RATIO : CHAR_WIDTH_RATIO);
    }
  }
  
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
  const watermark = showWatermark ? buildWatermark() : '';
  
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

  // Use foreignObject with HTML — browser renders text + emoji natively
  const subColorValue = subheaderColor || textColor;

  const htmlContent = hasSubheader
    ? `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${WIDTH}px;height:${HEIGHT}px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${VERTICAL_PAD}px ${MARGIN}px;box-sizing:border-box;">
  ${googleFontsStyle}
  <div style="font-family:${escapeXml(headerFontFamily)};font-size:${effHeaderSize}px;font-weight:700;color:${textColor};line-height:1;text-align:center;white-space:nowrap;">${escapeXml(header)}</div>
  <div style="font-family:${escapeXml(subheaderFontFamily)};font-size:${effSubSize}px;font-weight:400;color:${subColorValue};line-height:1;text-align:center;white-space:nowrap;margin-top:${effGap}px;">${escapeXml(subheader!)}</div>
</div>`
    : `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${WIDTH}px;height:${HEIGHT}px;display:flex;align-items:center;justify-content:center;padding:0 ${MARGIN}px;box-sizing:border-box;">
  ${googleFontsStyle}
  <div style="font-family:${escapeXml(headerFontFamily)};font-size:${effHeaderSize}px;font-weight:700;color:${textColor};line-height:1;text-align:center;white-space:nowrap;">${escapeXml(header)}</div>
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
