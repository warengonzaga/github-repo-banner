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
  
  // If within limit, return as is
  if (stripped.length <= maxLength) {
    return stripped;
  }
  
  // Truncate at maxLength
  let truncated = stripped.slice(0, maxLength);
  
  // Check if we're in the middle of an icon syntax ![...] or ![...](theme)
  // If the truncated string has an unclosed icon, remove it
  const lastOpenBracket = truncated.lastIndexOf('![');
  
  if (lastOpenBracket !== -1) {
    // Check if there's a closing bracket after the last opening
    const afterOpen = truncated.slice(lastOpenBracket);
    const hasClosing = afterOpen.includes(']');
    
    // If no closing bracket, we cut in the middle of an icon - remove it
    if (!hasClosing) {
      truncated = truncated.slice(0, lastOpenBracket);
    } else {
      // Check if there's a '](' sequence (optional theme suffix)
      const themeStartIndex = afterOpen.indexOf('](');
      if (themeStartIndex !== -1) {
        // Verify if there's a closing ')' after ']('
        const afterThemeStart = afterOpen.slice(themeStartIndex + 2);
        const hasClosingParen = afterThemeStart.includes(')');
        
        // If no closing ')', we cut in the middle of the theme - remove it
        if (!hasClosingParen) {
          truncated = truncated.slice(0, lastOpenBracket);
        }
      }
    }
  }
  
  return truncated.trimEnd();
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
