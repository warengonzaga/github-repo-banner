import type { BannerOptions, BackgroundPreset, HeaderSegment } from './types.js';
import {
  parseHeaderSegments,
  emojiToCodepoint,
  fetchTwemojiSVG,
  buildEmojiImageElement,
} from './emoji.js';
import { escapeXml } from '../utils/sanitize.js';

const WIDTH = 1280;
const HEIGHT = 304;
const MARGIN = 100; // left and right margin — always maintained
const MAX_CONTENT_WIDTH = WIDTH - MARGIN * 2; // 1080px usable
const BASE_FONT_SIZE = 192;
const MIN_FONT_SIZE = 24;
const CHAR_WIDTH_RATIO = 0.55;
const EMOJI_PADDING = 12;

function buildGradientDef(bg: BackgroundPreset): string {
  if (!bg.stops) return '';
  const stops = bg.stops
    .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}" />`)
    .join('');
  return `<linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`;
}

function buildBackground(bg: BackgroundPreset): string {
  const fill =
    bg.type === 'gradient' ? 'url(#bg-gradient)' : bg.color ?? '#f3f4f6';
  return `<rect width="${WIDTH}" height="${HEIGHT}" fill="${fill}" />`;
}

/**
 * Build watermark credit element in bottom right corner.
 */
function buildWatermark(): string {
  const text = 'made with ghrb.waren.build';
  const fontSize = 16;
  const rectPaddingX = 8;
  const rectPaddingY = 6;

  // Estimate text width (rough approximation)
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
 * Estimate the total width of rendered segments at a given font size.
 */
function estimateTotalWidth(
  segments: HeaderSegment[],
  fontSize: number,
): number {
  let total = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type === 'text') {
      total += seg.value.length * fontSize * CHAR_WIDTH_RATIO;
    } else {
      total += fontSize; // emoji rendered at same size as font
    }
    if (i < segments.length - 1) {
      total += EMOJI_PADDING;
    }
  }
  return total;
}

/**
 * Compute the font size that fits the content within MAX_CONTENT_WIDTH.
 * Starts at the given base size and scales down proportionally until it fits.
 */
function fitFontSize(segments: HeaderSegment[], baseSize: number): number {
  const widthAtBase = estimateTotalWidth(segments, baseSize);
  if (widthAtBase <= MAX_CONTENT_WIDTH) return baseSize;

  const scaled = baseSize * (MAX_CONTENT_WIDTH / widthAtBase);
  return Math.max(MIN_FONT_SIZE, Math.round(scaled));
}

/**
 * Render a row of segments (text + emoji) centered at the given Y position.
 */
async function renderSegments(
  segments: HeaderSegment[],
  fontSize: number,
  centerY: number,
  color: string,
  fontFamily: string,
  fontWeight: string,
): Promise<string[]> {
  const totalWidth = estimateTotalWidth(segments, fontSize);
  const startX = Math.max(MARGIN, (WIDTH - totalWidth) / 2);
  const emojiSize = fontSize;
  const elements: string[] = [];
  let cursorX = startX;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];

    if (seg.type === 'emoji') {
      const codepoint = emojiToCodepoint(seg.value);
      const svgData = await fetchTwemojiSVG(codepoint);
      if (svgData) {
        const emojiY = centerY - emojiSize / 2;
        elements.push(
          buildEmojiImageElement(svgData, cursorX, emojiY, emojiSize),
        );
      }
      cursorX += emojiSize;
    } else {
      const textWidth = seg.value.length * fontSize * CHAR_WIDTH_RATIO;
      const textX = cursorX + textWidth / 2;
      elements.push(
        `<text x="${textX}" y="${centerY}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${escapeXml(seg.value)}</text>`,
      );
      cursorX += textWidth;
    }

    if (i < segments.length - 1) {
      cursorX += EMOJI_PADDING;
    }
  }

  return elements;
}

/**
 * Build the full banner SVG string.
 * Async because emoji segments require fetching Twemoji SVGs from the CDN.
 */
export async function buildBannerSVG(options: BannerOptions): Promise<string> {
  const {
    header,
    subheader,
    background,
    textColor,
    subheaderColor,
    fontFamily,
    showWatermark = false,
  } = options;

  const segments = parseHeaderSegments(header);
  const hasSubheader = !!subheader;
  const subSegments = hasSubheader ? parseHeaderSegments(subheader) : [];

  // Header: start at BASE_FONT_SIZE, shrink until it fits within margins
  const headerFontSize = fitFontSize(segments, BASE_FONT_SIZE);

  // Subheader: 40% of header font size, also shrink to fit within margins
  const subBaseFontSize = hasSubheader ? Math.round(headerFontSize * 0.4) : 0;
  const subFontSize = hasSubheader ? fitFontSize(subSegments, subBaseFontSize) : 0;

  // Vertical layout
  const VERTICAL_PAD = 10;
  const availableHeight = HEIGHT - VERTICAL_PAD * 2;

  let headerY: number;
  let subY: number = 0;

  if (hasSubheader) {
    // Gap between header baseline and subheader top
    const gap = Math.round(subFontSize * 0.3);
    const totalHeight = headerFontSize + gap + subFontSize;

    // If combined height exceeds available space, scale both down proportionally
    const scale = totalHeight > availableHeight ? availableHeight / totalHeight : 1;
    const effHeaderSize = Math.round(headerFontSize * scale);
    const effSubSize = Math.round(subFontSize * scale);
    const effGap = Math.round(gap * scale);
    const effTotal = effHeaderSize + effGap + effSubSize;

    // Center the group vertically
    const groupTop = (HEIGHT - effTotal) / 2;
    headerY = groupTop + effHeaderSize / 2;
    subY = groupTop + effHeaderSize + effGap + effSubSize / 2;

    const defs = buildGradientDef(background);
    const bgRect = buildBackground(background);

    const headerElements = await renderSegments(
      segments, effHeaderSize, headerY, textColor, fontFamily, '700',
    );
    const subElements = await renderSegments(
      subSegments, effSubSize, subY, subheaderColor || textColor, fontFamily, '400',
    );

    const watermark = showWatermark ? buildWatermark() : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>${defs}</defs>
${bgRect}
${headerElements.join('\n')}
${subElements.join('\n')}
${watermark}
</svg>`;
  } else {
    // Header only — centered
    headerY = HEIGHT / 2;

    const defs = buildGradientDef(background);
    const bgRect = buildBackground(background);

    const headerElements = await renderSegments(
      segments, headerFontSize, headerY, textColor, fontFamily, '700',
    );

    const watermark = showWatermark ? buildWatermark() : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>${defs}</defs>
${bgRect}
${headerElements.join('\n')}
${watermark}
</svg>`;
  }
}
