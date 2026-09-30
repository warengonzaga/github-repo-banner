import { Hono } from 'hono';
import { parseBannerOptions } from '../banner/options.js';
import { buildBannerSVG } from '../banner/svg-template.js';
import { getRedis, isStatsEnabled } from '../config/redis.js';
import { recordBannerRequest, usageOptedOut } from '../utils/usage-stats.js';

const bannerRoute = new Hono();

bannerRoute.get('/banner', async (c) => {
  let options: ReturnType<typeof parseBannerOptions>;
  try {
    options = parseBannerOptions(c.req.query());
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : 'Invalid image settings.',
      },
      400,
    );
  }
  let svg: string;
  try {
    svg = await buildBannerSVG(options);
  } catch {
    return c.json(
      {
        error:
          'A custom image is unavailable. Use a public HTTPS raster image up to 1 MiB and 16,777,216 pixels across all frames, then try again.',
      },
      422,
    );
  }

  const redis = getRedis();
  if (
    c.req.method === 'GET' &&
    isStatsEnabled() &&
    redis?.status === 'ready' &&
    !usageOptedOut(
      c.req.query('stats'),
      c.req.header('dnt'),
      c.req.header('sec-gpc'),
    )
  ) {
    // Successful renders only; measurement failure must not break banner delivery.
    void recordBannerRequest(redis, c.req.header('referer') || '');
  }

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
