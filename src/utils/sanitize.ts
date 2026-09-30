import { isPrivateHost } from '../ui/image-url.js';

export { isValidImageUrl } from '../ui/image-url.js';

import type { LookupAddress } from 'node:dns';
import { lookup } from 'node:dns/promises';
import { sanitizeBannerText } from '../ui/inline-icons.js';
import { ICON_SLUG_SANITIZE_RE } from './icon-syntax.js';

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

export const sanitizeHeader = sanitizeBannerText;

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

export async function resolvePublicImageAddress(
  hostname: string,
): Promise<LookupAddress | null> {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  const firstAddress = addresses[0];
  if (
    !firstAddress ||
    addresses.some(({ address }) => isPrivateHost(address))
  ) {
    return null;
  }
  return firstAddress;
}
