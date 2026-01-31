import { Hono } from 'hono';
import { buildBannerSVG } from '../banner/svg-template.js';
import { BACKGROUNDS, DEFAULT_BG } from '../banner/backgrounds.js';
import { sanitizeHeader, isValidHexColor } from '../utils/sanitize.js';

const bannerRoute = new Hono();

bannerRoute.get('/banner', async (c) => {
  const rawHeader = c.req.query('header') || 'Hello World';
  const rawSubheader = c.req.query('subheader') || '';
  const bgKey = c.req.query('bg') || DEFAULT_BG;
  const colorParam = c.req.query('color') || '';
  const subheaderColorParam = c.req.query('subheadercolor') || '';
  const supportParam = c.req.query('support') || '';

  const header = sanitizeHeader(rawHeader, 50);
  const subheader = rawSubheader ? sanitizeHeader(rawSubheader, 60) : undefined;
  const background = BACKGROUNDS[bgKey] ?? BACKGROUNDS[DEFAULT_BG];
  const textColor =
    colorParam && isValidHexColor(colorParam)
      ? `#${colorParam}`
      : background.defaultTextColor;
  const subheaderColor =
    subheaderColorParam && isValidHexColor(subheaderColorParam)
      ? `#${subheaderColorParam}`
      : undefined;

  const showWatermark = supportParam === 'true';

  const svg = await buildBannerSVG({
    header,
    subheader,
    background,
    textColor,
    subheaderColor,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    showWatermark,
  });

  const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  const cacheControl = isDev
    ? 'no-cache, no-store, must-revalidate'
    : 'public, max-age=86400, s-maxage=86400';

  return c.body(svg, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': cacheControl,
  });
});

export default bannerRoute;
