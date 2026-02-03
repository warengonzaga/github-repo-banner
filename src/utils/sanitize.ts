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
  
  // Calculate display length by removing icon syntax from the count
  // Icons render as images, not text, so they shouldn't count toward text limits
  const displayText = stripped.replace(/!\[[a-z0-9-]+\](?:\((light|dark|auto)\))?/gi, '');
  
  // If display content is within limit, return as is
  if (displayText.length <= maxLength) {
    return stripped;
  }
  
  // Need to truncate while preserving complete icon syntax
  // Build string character by character, skipping icon syntax in count
  let result = '';
  let displayCount = 0;
  let i = 0;
  
  while (i < stripped.length && displayCount < maxLength) {
    // Check if we're at the start of an icon
    if (stripped.slice(i).match(/^!\[[a-z0-9-]+\](?:\((light|dark|auto)\))?/i)) {
      const iconMatch = stripped.slice(i).match(/^!\[[a-z0-9-]+\](?:\((light|dark|auto)\))?/i);
      if (iconMatch) {
        // Add the entire icon syntax without counting it
        result += iconMatch[0];
        i += iconMatch[0].length;
        continue;
      }
    }
    
    // Regular character - add and count it
    result += stripped[i];
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
