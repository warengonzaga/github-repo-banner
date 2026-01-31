import type { HeaderSegment } from './types.js';

// In-memory cache for fetched Twemoji SVGs
const emojiCache = new Map<string, string>();

// Regex that matches most common emoji (including multi-codepoint sequences)
// Covers: emoticons, symbols, flags, skin tones, ZWJ sequences
const EMOJI_RE =
  /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;

/**
 * Convert an emoji character (possibly multi-codepoint) to a Twemoji filename.
 * E.g. "🚀" → "1f680", "👨‍💻" → "1f468-200d-1f4bb"
 */
export function emojiToCodepoint(emoji: string): string {
  return [...emoji]
    .filter((cp) => cp !== '\uFE0F') // strip variation selector
    .map((char) => char.codePointAt(0)!.toString(16))
    .join('-');
}

/**
 * Fetch a Twemoji SVG from the CDN and cache it.
 * Returns the raw SVG string, or null if not found.
 */
export async function fetchTwemojiSVG(
  codepoint: string,
): Promise<string | null> {
  if (emojiCache.has(codepoint)) {
    return emojiCache.get(codepoint)!;
  }

  const url = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${codepoint}.svg`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const svg = await res.text();
    emojiCache.set(codepoint, svg);
    return svg;
  } catch {
    return null;
  }
}

/**
 * Build an SVG `<image>` element with the emoji embedded as a base64 data URI.
 */
export function buildEmojiImageElement(
  svgData: string,
  x: number,
  y: number,
  size: number,
): string {
  const base64 = Buffer.from(svgData).toString('base64');
  return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/svg+xml;base64,${base64}" />`;
}

/**
 * Parse a header string into segments of text and emoji.
 * E.g. "🚀 My Project 🔥" → [emoji, text, emoji]
 */
export function parseHeaderSegments(header: string): HeaderSegment[] {
  const segments: HeaderSegment[] = [];
  let lastIndex = 0;

  for (const match of header.matchAll(EMOJI_RE)) {
    const matchStart = match.index!;

    // Text before this emoji
    if (matchStart > lastIndex) {
      const text = header.slice(lastIndex, matchStart);
      if (text) {
        segments.push({ type: 'text', value: text });
      }
    }

    segments.push({ type: 'emoji', value: match[0] });
    lastIndex = matchStart + match[0].length;
  }

  // Remaining text after last emoji
  if (lastIndex < header.length) {
    const text = header.slice(lastIndex);
    if (text) {
      segments.push({ type: 'text', value: text });
    }
  }

  // If no segments found (no emoji, empty after strip), treat whole header as text
  if (segments.length === 0 && header.length > 0) {
    segments.push({ type: 'text', value: header });
  }

  return segments;
}
