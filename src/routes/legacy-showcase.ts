import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getRedis } from '../config/redis.js';

const SHOWCASE_KEY = 'showcase:v1:entries';
const exportId =
  /^\d{13}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const tokenPattern = /^[a-f0-9]{64}$/;
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const legacyShowcaseRoute = new Hono();

legacyShowcaseRoute.use('/showcase/*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  c.header('Referrer-Policy', 'no-referrer');
  await next();
});
legacyShowcaseRoute.use(
  '/showcase/*',
  bodyLimit({ maxSize: 1024 }),
);
legacyShowcaseRoute.use('/showcase/*', async (c, next) => {
  if (
    c.req.header('origin') !==
      (process.env.PUBLIC_ORIGIN || new URL(c.req.url).origin) ||
    c.req.header('content-type')?.split(';')[0].trim() !== 'application/json'
  ) {
    return c.json({ error: 'Use this instance’s removal page.' }, 403);
  }
  await next();
});

legacyShowcaseRoute.delete('/showcase/:id', async (c) => {
  const id = c.req.param('id');
  if (!exportId.test(id)) return c.notFound();

  let removalToken: unknown;
  try {
    const body: unknown = await c.req.json();
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      removalToken = (body as Record<string, unknown>).removalToken;
    }
  } catch {
    // Return the same validation error for malformed JSON and missing tokens.
  }
  if (typeof removalToken !== 'string' || !tokenPattern.test(removalToken)) {
    return c.json({ error: 'Enter a valid removal code.' }, 400);
  }

  const redis = getRedis();
  if (!redis || redis.status !== 'ready') {
    return c.json({ error: 'Removal is temporarily unavailable.' }, 503);
  }

  try {
    const removed = await redis.eval(
      `
      local entry = redis.call('HGET', KEYS[1], ARGV[1])
      if not entry then return 0 end
      if cjson.decode(entry).removalHash ~= ARGV[2] then return -1 end
      return redis.call('HDEL', KEYS[1], ARGV[1])
    `,
      2,
      SHOWCASE_KEY,
      exportKey(id),
      id,
      digest(removalToken),
    );
    if (removed === -1) {
      return c.json({ error: 'This removal code does not match the design.' }, 403);
    }
    return c.json({ removed: true });
  } catch {
    return c.json({ error: 'Removal failed. Please try again.' }, 503);
  }
});

export default legacyShowcaseRoute;
