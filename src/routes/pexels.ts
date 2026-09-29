import { Hono } from 'hono';
import { BoundedCache } from '../utils/bounded-cache.js';

const pexelsRoute = new Hono();

const cache = new BoundedCache(2 * 1024 * 1024, 300_000, 4);
// ponytail: process-local budget; replicas sharing a key need a shared limiter.
const requests: number[] = [];
const MAX_REQUESTS_PER_HOUR = 100;

const PEXELS_API_URL = 'https://api.pexels.com/v1';

pexelsRoute.get('/api/pexels/search', async (c) => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Pexels API not configured' }, 503);
  }

  const query =
    (c.req.query('q') || 'nature')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .slice(0, 100) || 'nature';
  const page = Math.max(
    1,
    parseInt(c.req.query('page') || '1', 10) || 1,
  ).toString();
  const perPage = '9';
  const orientation = 'landscape';

  try {
    const url = `${PEXELS_API_URL}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=${orientation}`;
    const result = await cache.get(url, async () => {
      const now = Date.now();
      while (requests.length && requests[0] <= now - 3_600_000)
        requests.shift();
      if (requests.length >= MAX_REQUESTS_PER_HOUR) return null;
      requests.push(now);
      const response = await fetch(url, {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error('Pexels API error');
      }

      const data = (await response.json()) as {
        photos: Array<{
          id: number;
          alt: string;
          photographer: string;
          src: { landscape: string; medium: string };
        }>;
        next_page?: string;
        total_results: number;
        page: number;
      };

      const photos = data.photos.map((p) => ({
        id: p.id,
        alt: p.alt,
        photographer: p.photographer,
        url: p.src.landscape,
        thumb: p.src.medium,
      }));

      return JSON.stringify({
        photos,
        total: data.total_results,
        page: data.page,
        hasMore: photos.length > 0 && Boolean(data.next_page),
      });
    });
    if (result === null) {
      c.header('Retry-After', '60');
      return c.json({ error: 'Search is busy. Try again later.' }, 429);
    }
    return c.body(result, 200, { 'Content-Type': 'application/json' });
  } catch {
    return c.json({ error: 'Failed to fetch from Pexels' }, 500);
  }
});

export default pexelsRoute;
