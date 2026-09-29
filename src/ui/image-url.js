const MAX_IMAGE_URL_LENGTH = 2048;

/** Block private and special-use hostnames and IP addresses before image fetches. */
/** @param {string} hostname */
export function isPrivateHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase().replace(/\.$/, '');

  // Block well-known private hostnames
  if (host === 'localhost') return true;
  if (
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.arpa')
  )
    return true;

  // WHATWG URL canonicalizes compressed, expanded and embedded IPv4 forms.
  if (host.includes(':')) {
    try {
      const canonical = new URL(`https://[${host}]/`).hostname.slice(1, -1);
      const [first, second] = canonical.split(':').map(part => parseInt(part || '0', 16));
      // Accept global unicast only; exclude special-purpose/documentation ranges.
      return (first & 0xe000) !== 0x2000 ||
        (first === 0x2001 && (second < 0x200 || second === 0xdb8)) ||
        first === 0x2002 || (first === 0x3fff && second < 0x1000);
    } catch { return true; }
  }
  const ipv4 = host;

  const parts = ipv4.split('.');
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    const [a, b] = parts.map((p) => parseInt(p, 10));
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 0 || a >= 224) return true; // 0.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
  }

  return false;
}

/** @param {string} value */
export function isValidImageUrl(value) {
  if (!value || value.length > MAX_IMAGE_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    if (isPrivateHost(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
