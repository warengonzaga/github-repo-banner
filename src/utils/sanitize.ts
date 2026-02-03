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

export function sanitizeHeader(raw: string, maxLength: number = 50): string {
  const stripped = raw.replace(/<[^>]*>/g, '');
  return stripped.slice(0, maxLength);
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
 * Only allows lowercase letters, numbers, and hyphens (Simple Icons format)
 * Limits length to prevent abuse
 */
export function sanitizeIconSlug(raw: string, maxLength: number = 50): string {
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return cleaned.slice(0, maxLength);
}

const HEX_COLOR_RE = /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?([0-9a-fA-F]{2})?$/;

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}
