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
const MARGIN = 100; // left and right margin
const MAX_CONTENT_WIDTH = WIDTH - MARGIN * 2; // 1080px usable
const BASE_FONT_SIZE = 192;
const MIN_FONT_SIZE = 48;
const CHAR_WIDTH_RATIO = 0.48;
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
 * Starts at BASE_FONT_SIZE and scales down proportionally if needed.
 */
function computeFontSize(segments: HeaderSegment[]): number {
  const widthAtBase = estimateTotalWidth(segments, BASE_FONT_SIZE);
  if (widthAtBase <= MAX_CONTENT_WIDTH) return BASE_FONT_SIZE;

  const scaled = BASE_FONT_SIZE * (MAX_CONTENT_WIDTH / widthAtBase);
  return Math.max(MIN_FONT_SIZE, Math.round(scaled));
}

/**
 * Build the full banner SVG string.
 * Async because emoji segments require fetching Twemoji SVGs from the CDN.
 */
export async function buildBannerSVG(options: BannerOptions): Promise<string> {
  const { header, background, textColor, fontFamily, showWatermark = false } = options;

  const segments = parseHeaderSegments(header);
  const fontSize = computeFontSize(segments);
  const emojiSize = fontSize;

  const totalWidth = estimateTotalWidth(segments, fontSize);
  // Ensure margins are respected even on overflow
  const startX = Math.max(MARGIN, (WIDTH - totalWidth) / 2);
  const centerY = HEIGHT / 2;

  const defs = buildGradientDef(background);
  const bgRect = buildBackground(background);

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
        `<text x="${textX}" y="${centerY}" text-anchor="middle" dominant-baseline="central" font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" font-weight="700" fill="${textColor}">${escapeXml(seg.value)}</text>`,
      );
      cursorX += textWidth;
    }

    if (i < segments.length - 1) {
      cursorX += EMOJI_PADDING;
    }
  }

  const watermark = showWatermark ? buildWatermark() : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<defs>${defs}</defs>
${bgRect}
${elements.join('\n')}
${watermark}
</svg>`;
}
