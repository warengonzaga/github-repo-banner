import { createHash, randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { getRedis } from '../config/redis.js';
import { BoundedCache } from '../utils/bounded-cache.js';

const pexelsRoute = new Hono();
// Keep only in-flight coalescing/concurrency; Redis owns all retained results.
const pending = new BoundedCache(0, 0, 4);
const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

// Atomic rolling-hour budget, shared by instances using the same Redis and key.
// Server time avoids app clock differences; failed upstream attempts still count.
const reserveRequest = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - 3600000)
if redis.call('ZCARD', KEYS[1]) >= 100 then return 0 end
redis.call('ZADD', KEYS[1], now, ARGV[1])
redis.call('PEXPIRE', KEYS[1], 3600000)
return 1
`;

class UpstreamError extends Error {}

async function fetchPhotos(url: string, apiKey: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error();
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
    const photos = data.photos.slice(0, 9).map((p) => ({
      id: p.id,
      alt: p.alt,
      photographer: p.photographer,
      url: p.src.landscape,
      thumb: p.src.medium,
    }));
    const result = JSON.stringify({
      photos,
      total: data.total_results,
      page: data.page,
      hasMore: photos.length > 0 && Boolean(data.next_page),
    });
    // Bound each Redis value; the rolling budget also bounds cache write volume.
    if (Buffer.byteLength(result) > 64 * 1024) throw new Error();
    return result;
  } catch {
    throw new UpstreamError();
  }
}

pexelsRoute.get('/api/pexels/search', async (c) => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return c.json({ error: 'Pexels API not configured' }, 503);

  const redis = getRedis();
  if (!redis || redis.status !== 'ready') {
    return c.json({ error: 'Search storage is unavailable' }, 503);
  }
  const query =
    (c.req.query('q') || 'nature')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .slice(0, 100) || 'nature';
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=9&orientation=landscape`;
  const prefix = `pexels:v1:${hash(apiKey)}`;
  const cacheKey = `${prefix}:cache:${hash(url)}`;

  try {
    const cached = await redis.get(cacheKey);
    const result =
      cached ??
      (await pending.get(cacheKey, async () => {
        // A previous fetch may finish between this request's GET and scheduling.
        const existing = await redis.get(cacheKey);
        if (existing !== null) return existing;
        const allowed = await redis.eval(
          reserveRequest,
          1,
          `${prefix}:requests`,
          randomUUID(),
        );
        if (allowed !== 1) return null;
        const photos = await fetchPhotos(url, apiKey);
        await redis.set(cacheKey, photos, 'EX', 300);
        return photos;
      }));
    if (result === null) {
      c.header('Retry-After', '60');
      return c.json({ error: 'Search is busy. Try again later.' }, 429);
    }
    return c.body(result, 200, { 'Content-Type': 'application/json' });
  } catch (error) {
    return error instanceof UpstreamError
      ? c.json({ error: 'Failed to fetch from Pexels' }, 500)
      : c.json({ error: 'Search storage is unavailable' }, 503);
  }
});

export default pexelsRoute;
