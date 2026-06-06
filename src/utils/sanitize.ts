import {
  createIconSyntaxRegExp,
  createIconSyntaxStartRegExp,
  ICON_SLUG_SANITIZE_RE,
} from './icon-syntax.js';

const XML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeXml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => XML_ESCAPE_MAP[ch] ?? ch);
}

// Use strict lowercase flags ('g' only, no 'i') to be consistent with parsing
// and width-estimation logic that also uses createIconSyntaxRegExp('g')
const ICON_SYNTAX_RE = createIconSyntaxRegExp('g');
const ICON_SYNTAX_START_RE = createIconSyntaxStartRegExp('');

// Hard cap on raw input length to prevent unbounded SVG/icon-fetch load
const RAW_MAX_LENGTH = 500;
// Maximum number of icons allowed per header/subheader field
const MAX_ICONS = 5;

export function sanitizeHeader(raw: string, maxLength: number = 50): string {
  const stripped = raw.replace(/<[^>]*>/g, '');

  // Apply hard cap before any other processing
  const safeCapped = stripped.slice(
    0,
    Math.min(stripped.length, RAW_MAX_LENGTH),
  );

  // Calculate display length by removing icon syntax from the count
  // Icons render as images, not text, so they shouldn't count toward text limits
  const displayText = safeCapped.replace(ICON_SYNTAX_RE, '');
  const totalIcons = (safeCapped.match(ICON_SYNTAX_RE) || []).length;

  // If display content and icon count are within limits, return as is
  if (displayText.length <= maxLength && totalIcons <= MAX_ICONS) {
    return safeCapped;
  }

  // Need to truncate while preserving complete icon syntax
  // Build string character by character, skipping icon syntax in count
  let result = '';
  let displayCount = 0;
  let iconCount = 0;
  let i = 0;

  while (i < safeCapped.length && displayCount < maxLength) {
    // Check if we're at the start of an icon
    if (safeCapped.slice(i).match(ICON_SYNTAX_START_RE)) {
      const iconMatch = safeCapped.slice(i).match(ICON_SYNTAX_START_RE);
      if (iconMatch) {
        // Only add the icon if we haven't hit the icon limit
        if (iconCount < MAX_ICONS) {
          result += iconMatch[0];
          iconCount++;
        }
        i += iconMatch[0].length;
        continue;
      }
    }

    // Regular character - add and count it
    result += safeCapped[i];
    displayCount++;
    i++;
  }

  // Check if we ended in the middle of an icon and remove it if so
  const lastOpenBracket = result.lastIndexOf('![');
  if (lastOpenBracket !== -1) {
    const afterOpen = result.slice(lastOpenBracket);
    const hasClosing = afterOpen.includes(']');

    if (!hasClosing) {
      result = result.slice(0, lastOpenBracket);
    } else {
      const themeStartIndex = afterOpen.indexOf('](');
      if (themeStartIndex !== -1) {
        const afterThemeStart = afterOpen.slice(themeStartIndex + 2);
        if (!afterThemeStart.includes(')')) {
          result = result.slice(0, lastOpenBracket);
        }
      }
    }
  }

  return result.trimEnd();
}

/**
 * Sanitize Google Font name
 * Only allows alphanumeric, spaces, and plus signs (for multi-word fonts)
 * Limits length to prevent abuse
 */
export function sanitizeFontName(raw: string, maxLength: number = 50): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9\s+]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitize Simple Icons slug
 * Only allows lowercase letters, numbers, hyphens, and underscores
 * Limits length to prevent abuse
 */
export function sanitizeIconSlug(raw: string, maxLength: number = 50): string {
  const cleaned = raw.toLowerCase().replace(ICON_SLUG_SANITIZE_RE, '');
  return cleaned.slice(0, maxLength);
}

const HEX_COLOR_RE = /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

const MAX_IMAGE_URL_LENGTH = 2048;

/**
 * Check whether a hostname is a private, loopback, link-local, or otherwise
 * reserved IP literal. This is a best-effort mitigation against SSRF to
 * internal services. It does not protect against DNS rebinding (where a public
 * hostname resolves to a private IP at fetch time); robust protection would
 * require resolving DNS and pinning the validated IP at fetch time.
 */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

  // IPv6 loopback and unique-local / link-local ranges
  if (host === '::1') return true;
  if (host.startsWith('fc') || host.startsWith('fd')) return true; // fc00::/7
  if (host.startsWith('fe80')) return true; // link-local
  // IPv4-mapped IPv6 (e.g. ::ffff:10.0.0.1) - extract the trailing IPv4
  const mapped = host.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  const ipv4 = mapped ? mapped[1] : host;

  const parts = ipv4.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    const [a, b] = parts.map((p) => parseInt(p, 10));
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
  }

  return false;
}

export function isValidImageUrl(value: string): boolean {
  if (!value || value.length > MAX_IMAGE_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (isPrivateHost(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
