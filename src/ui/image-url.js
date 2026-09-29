const MAX_IMAGE_URL_LENGTH = 2048;

/** Block private and special-use hostnames and IP addresses before image fetches. */
/** @param {string} hostname */
export function isPrivateHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

  // Block well-known private hostnames
  if (host === 'localhost') return true;
  if (
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.arpa')
  )
    return true;

  // IPv6 loopback and unique-local / link-local ranges
  if (host === '::1') return true;
  if (host.includes(':') && (host.startsWith('fc') || host.startsWith('fd')))
    return true; // fc00::/7
  if (host.includes(':') && host.startsWith('fe80')) return true; // link-local
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
