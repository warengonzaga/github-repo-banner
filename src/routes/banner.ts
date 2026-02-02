import { Hono } from 'hono';
import { buildBannerSVG } from '../banner/svg-template.js';
import { sanitizeHeader, sanitizeFontName, isValidHexColor } from '../utils/sanitize.js';
import { getRedis, isStatsEnabled } from '../config/redis.js';

const bannerRoute = new Hono();

bannerRoute.get('/banner', async (c) => {
  // Track repository usage if stats enabled
  const referer = c.req.header('referer') || '';
  const repoMatch = referer.match(/github\.com\/([^\/]+\/[^\/]+)(?:\/|$)/);

  if (repoMatch && isStatsEnabled()) {
    const repo = repoMatch[1];
    // Skip obvious non-repo paths
    const nonRepoPrefixes = ['settings', 'orgs', 'users', 'explore', 'notifications', 'issues', 'pulls'];
    const isNonRepoPath = nonRepoPrefixes.some(p => repo.startsWith(p + '/'));
    
    if (!isNonRepoPath) {
      const redis = getRedis();
      // Fire and forget - don't block banner generation
      redis?.sadd('repos:tracked', repo).catch(() => {});
    }
  }

  const rawHeader = c.req.query('header') || 'Hello World';
  const rawSubheader = c.req.query('subheader') || '';
  const bgParam = c.req.query('bg') || '1a1a1a-4a4a4a'; // Default gradient
  const colorParam = c.req.query('color') || '';
  const subheaderColorParam = c.req.query('subheadercolor') || '';
  const supportParam = c.req.query('support') || '';
  const headerFontParam = c.req.query('headerfont') || '';
  const subheaderFontParam = c.req.query('subheaderfont') || '';
  const watermarkPosParam = c.req.query('watermarkpos') || 'bottom-right';

  const header = sanitizeHeader(rawHeader, 50);
  const subheader = rawSubheader ? sanitizeHeader(rawSubheader, 60) : undefined;
  
  // Parse bg parameter: gradient (hex-hex) or solid (hex)
  let background;
  
  if (bgParam.includes('-')) {
    // Gradient: two hex codes separated by hyphen
    const [startHex, endHex] = bgParam.split('-');
    if (isValidHexColor(startHex) && isValidHexColor(endHex)) {
      background = {
        id: 'gradient',
        name: 'Gradient',
        type: 'gradient' as const,
        stops: [
          { offset: '0%', color: `#${startHex}` },
          { offset: '100%', color: `#${endHex}` },
        ],
        defaultTextColor: '#ffffff',
      };
    } else {
      // Invalid gradient, use default
      background = {
        id: 'gradient',
        name: 'Gradient',
        type: 'gradient' as const,
        stops: [
          { offset: '0%', color: '#1a1a1a' },
          { offset: '100%', color: '#4a4a4a' },
        ],
        defaultTextColor: '#ffffff',
      };
    }
  } else {
    // Solid color: single hex code (including transparent 00000000)
    if (isValidHexColor(bgParam)) {
      background = {
        id: 'solid',
        name: 'Solid',
        type: 'solid' as const,
        color: `#${bgParam}`,
        defaultTextColor: '#ffffff',
      };
    } else {
      // Invalid hex, use default gradient
      background = {
        id: 'gradient',
        name: 'Gradient',
        type: 'gradient' as const,
        stops: [
          { offset: '0%', color: '#1a1a1a' },
          { offset: '100%', color: '#4a4a4a' },
        ],
        defaultTextColor: '#ffffff',
      };
    }
  }
  
  const textColor =
    colorParam && isValidHexColor(colorParam)
      ? `#${colorParam}`
      : background.defaultTextColor;
  const subheaderColor =
    subheaderColorParam && isValidHexColor(subheaderColorParam)
      ? `#${subheaderColorParam}`
      : undefined;

  const showWatermark = supportParam === 'true';
  
  // Validate watermark position
  const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  const watermarkPosition = validPositions.includes(watermarkPosParam) ? watermarkPosParam : 'bottom-right';
  
  // Sanitize and validate font parameters
  const headerFont = headerFontParam ? sanitizeFontName(headerFontParam, 50) : undefined;
  const subheaderFont = subheaderFontParam ? sanitizeFontName(subheaderFontParam, 50) : undefined;

  const svg = await buildBannerSVG({
    header,
    subheader,
    background,
    textColor,
    subheaderColor,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headerFont,
    subheaderFont,
    showWatermark,
    watermarkPosition,
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
