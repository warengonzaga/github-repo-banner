import type { HeaderSegment, BackgroundPreset } from './types.js';
import { emojiToCodepoint, fetchTwemojiSVG } from './emoji.js';
import { escapeXml, sanitizeIconSlug } from '../utils/sanitize.js';

// In-memory cache for fetched Simple Icons SVGs
const iconCache = new Map<string, string>();

// Regex to match icon syntax: ![slug] or ![slug](theme)
const ICON_RE = /!\[([a-z0-9-]+)\](?:\((light|dark|auto)\))?/g;

// Regex to detect emojis (same as in emoji.ts)
const EMOJI_RE =
  /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*/gu;

/**
 * Fetch a Simple Icons SVG from CDN with specified color
 * @param slug Icon slug (e.g., 'github', 'react')
 * @param color Hex color without # (e.g., 'ffffff')
 * @returns SVG string or null if not found
 */
export async function fetchSimpleIconSVG(
  slug: string,
  color: string,
): Promise<string | null> {
  // Sanitize the slug to ensure it's valid
  const cleanSlug = sanitizeIconSlug(slug);
  if (!cleanSlug) return null;

  const cacheKey = `${cleanSlug}-${color}`;

  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const url = `https://cdn.simpleicons.org/${cleanSlug}/${color}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const svg = await res.text();
    iconCache.set(cacheKey, svg);
    return svg;
  } catch {
    return null;
  }
}

/**
 * Calculate relative luminance of a color (WCAG 2.0 formula)
 * Returns value between 0 (black) and 1 (white)
 * @param hexColor Hex color string (with or without #, supports 6 and 8 char formats)
 */
export function calculateLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values (handle both 6 and 8 char hex, ignore alpha if present)
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction (linearize RGB values)
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  // Calculate relative luminance using WCAG formula
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Determine if a background is light or dark for auto theme selection
 * @param background The background preset to analyze
 * @returns 'light' if background is light (needs dark icons), 'dark' if dark (needs light icons)
 */
export function detectBackgroundTheme(
  background: BackgroundPreset,
): 'light' | 'dark' {
  if (background.type === 'transparent') {
    // Assume transparent = light background (common for GitHub READMEs)
    return 'light';
  }

  if (background.type === 'solid' && background.color) {
    const luminance = calculateLuminance(background.color);
    // Threshold: 0.5 is middle gray
    return luminance > 0.5 ? 'light' : 'dark';
  }

  // Gradient: average the luminance of all stop colors
  if (background.type === 'gradient' && background.stops) {
    const luminances = background.stops.map((stop) =>
      calculateLuminance(stop.color),
    );
    const avgLuminance =
      luminances.reduce((a, b) => a + b, 0) / luminances.length;
    return avgLuminance > 0.5 ? 'light' : 'dark';
  }

  // Fallback to dark
  return 'dark';
}

/**
 * Parse header string into segments of text, emoji, and icons
 * This function combines both emoji and icon detection
 * @param header The header text to parse
 * @returns Array of segments in order
 */
export function parseHeaderWithIcons(header: string): HeaderSegment[] {
  if (!header) return [];

  const segments: HeaderSegment[] = [];

  // First, we need to identify all icons and their positions
  const iconMatches: Array<{
    index: number;
    length: number;
    slug: string;
    theme: 'light' | 'dark' | 'auto';
  }> = [];

  for (const match of header.matchAll(ICON_RE)) {
    iconMatches.push({
      index: match.index!,
      length: match[0].length,
      slug: match[1],
      theme: (match[2] as 'light' | 'dark' | 'auto') || 'auto',
    });
  }

  // Process the text, splitting by icons
  let lastIndex = 0;

  for (const iconMatch of iconMatches) {
    // Process text before this icon (which may contain emoji)
    if (iconMatch.index > lastIndex) {
      const textBefore = header.slice(lastIndex, iconMatch.index);
      if (textBefore) {
        const emojiSegments = parseEmojiInText(textBefore);
        segments.push(...emojiSegments);
      }
    }

    // Add icon segment
    segments.push({
      type: 'icon',
      value: iconMatch.slug,
      theme: iconMatch.theme,
    });

    lastIndex = iconMatch.index + iconMatch.length;
  }

  // Add remaining text after last icon
  if (lastIndex < header.length) {
    const remainingText = header.slice(lastIndex);
    if (remainingText) {
      const emojiSegments = parseEmojiInText(remainingText);
      segments.push(...emojiSegments);
    }
  }

  // If no segments found, treat whole header as text
  if (segments.length === 0 && header.length > 0) {
    segments.push({ type: 'text', value: header });
  }

  return segments;
}

/**
 * Helper to parse emoji within text
 * Splits text into text and emoji segments
 * @param text Text string that may contain emoji
 * @returns Array of text and emoji segments
 */
function parseEmojiInText(text: string): HeaderSegment[] {
  const segments: HeaderSegment[] = [];
  let lastIdx = 0;

  for (const match of text.matchAll(EMOJI_RE)) {
    // Add text before this emoji
    if (match.index! > lastIdx) {
      segments.push({ type: 'text', value: text.slice(lastIdx, match.index!) });
    }
    // Add emoji
    segments.push({ type: 'emoji', value: match[0] });
    lastIdx = match.index! + match[0].length;
  }

  // Add remaining text
  if (lastIdx < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIdx) });
  }

  // If no segments, treat entire text as text segment
  if (segments.length === 0 && text.length > 0) {
    segments.push({ type: 'text', value: text });
  }

  return segments;
}

/**
 * Render segments (text/emoji/icons) as HTML
 * @param segments Array of segments to render
 * @param fontSize Font size in pixels for inline images
 * @param textColor Text color (hex with #) to use for icons
 * @param backgroundTheme The detected background theme (for auto icons)
 * @returns HTML string with inline images for emoji and icons
 */
export async function renderSegmentsAsHTML(
  segments: HeaderSegment[],
  fontSize: number,
  textColor: string,
  backgroundTheme: 'light' | 'dark',
): Promise<string> {
  const parts: string[] = [];

  for (const segment of segments) {
    if (segment.type === 'text') {
      // XML-escape text and render directly
      parts.push(escapeXml(segment.value));
    } else if (segment.type === 'emoji') {
      // Fetch Twemoji SVG and render as inline image
      const codepoint = emojiToCodepoint(segment.value);
      const svgData = await fetchTwemojiSVG(codepoint);

      if (svgData) {
        // Convert to base64 and render as inline img
        const base64 = Buffer.from(svgData).toString('base64');
        parts.push(
          `<img src="data:image/svg+xml;base64,${base64}" style="display:inline-block;width:${fontSize}px;height:${fontSize}px;vertical-align:middle;margin:0 0.1em;" alt="" />`,
        );
      } else {
        // Fallback to text if emoji fetch fails
        parts.push(escapeXml(segment.value));
      }
    } else if (segment.type === 'icon') {
      // Determine the theme to use for this icon
      const iconTheme =
        segment.theme === 'auto' ? backgroundTheme : segment.theme!;

      // Get color for icon based on theme
      // 'light' theme = icon for light background = dark icon
      // 'dark' theme = icon for dark background = light icon
      let iconColor: string;
      if (iconTheme === 'light') {
        // Light background needs dark icon for contrast
        iconColor = '000000';
      } else if (iconTheme === 'dark') {
        // Dark background needs light icon for contrast
        iconColor = 'ffffff';
      } else {
        // Auto mode: use text color for consistency
        iconColor = textColor.replace('#', '');
      }

      // Fetch Simple Icon SVG
      const svgData = await fetchSimpleIconSVG(segment.value, iconColor);

      if (svgData) {
        // Convert to base64 and render as inline img
        const base64 = Buffer.from(svgData).toString('base64');
        parts.push(
          `<img src="data:image/svg+xml;base64,${base64}" style="display:inline-block;width:${fontSize}px;height:${fontSize}px;vertical-align:middle;margin:0 0.1em;" alt="" />`,
        );
      }
      // If icon not found, don't render anything (silent fail)
      // This gives users feedback that the icon name is invalid
    }
  }

  return parts.join('');
}
