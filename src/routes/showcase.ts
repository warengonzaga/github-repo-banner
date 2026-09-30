import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { parseBannerOptions } from '../banner/options.js';
import { buildBannerSVG } from '../banner/svg-template.js';
import type { BannerOptions } from '../banner/types.js';
import {
  getExportRetentionDays,
  getPublicOrigin,
  getRedis,
  isOfficialInstance,
  isStatsEnabled,
} from '../config/redis.js';
import { describeBannerText } from '../ui/inline-icons.js';
import {
  recordExportRequest,
  usageKeys,
  usageOptedOut,
} from '../utils/usage-stats.js';

export const SHOWCASE_KEY = 'showcase:v1:entries';
export const EXPORT_INDEX_KEY = 'exports:v1:expiry';
export const EXPORT_RATE_KEY = 'exports:v1:admissions';
export const MAX_EXPORTS = 5_000;
export const MAX_EXPORT_BYTES = 8_192;
export const EXPORTS_PER_MINUTE = 60;
export const NEW_EXPORT_WINDOW_MS = 15 * 60_000;
export const SHOWCASE_POLICY = '2026-09-29';
export const exportKey = (id: string) => `exports:v1:${id}`;
const exportId =
  /^\d{13}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const tokenPattern = /^[a-f0-9]{64}$/;
const actions = new Set(['markdown', 'url', 'svg', 'png']);
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');
interface Entry {
  id: string;
  createdAt: number;
  options: BannerOptions;
  removalHash: string;
  fingerprint: string;
  policyVersion: string;
  action: string;
  showcased: boolean;
  expiresAt: number;
  showcaseReason?: string;
}
const route = new Hono();
for (const path of ['/exports', '/showcase', '/showcase/*']) {
  route.use(path, async (c, next) => {
    c.header('Cache-Control', 'no-store');
    c.header('Referrer-Policy', 'no-referrer');
    await next();
  });
  route.use(path, bodyLimit({ maxSize: 12_288 }));
  // Browser mutations must originate here, use JSON and never put removal codes in URLs.
  route.use(path, async (c, next) => {
    if (c.req.method === 'POST' || c.req.method === 'DELETE') {
      if (
        c.req.header('origin') !==
          (getPublicOrigin() || new URL(c.req.url).origin) ||
        c.req.header('content-type')?.split(';')[0].trim() !==
          'application/json'
      ) {
        return c.json(
          { error: 'Use this instance’s export and removal controls.' },
          403,
        );
      }
    }
    await next();
  });
}

route.post('/exports', async (c) => {
  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid export request.' }, 400);
  }
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    typeof body.action !== 'string' ||
    !actions.has(body.action) ||
    typeof body.showcase !== 'boolean'
  ) {
    return c.json(
      { error: 'Choose an export action and showcase preference.' },
      400,
    );
  }
  const official = isOfficialInstance();
  const allowed = official
    ? ['action', 'showcase', 'id', 'removalToken', 'query', 'policyVersion']
    : ['action', 'showcase'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    return c.json(
      {
        error: 'Unexpected export fields.',
      },
      400,
    );
  }
  const redis = getRedis();
  const count =
    isStatsEnabled() &&
    !usageOptedOut(
      c.req.query('stats'),
      c.req.header('dnt'),
      c.req.header('sec-gpc'),
    );
  if (!official && !body.showcase) {
    const counted =
      count && redis?.status === 'ready'
        ? await recordExportRequest(redis, false)
        : false;
    return c.json({ showcased: false, counted });
  }
  if (!official)
    return c.json(
      { error: 'Showcasing is not enabled on this instance.' },
      404,
    );
  if (
    typeof body.id !== 'string' ||
    !exportId.test(body.id) ||
    typeof body.removalToken !== 'string' ||
    !tokenPattern.test(body.removalToken) ||
    body.policyVersion !== SHOWCASE_POLICY ||
    !body.query ||
    typeof body.query !== 'object' ||
    Array.isArray(body.query) ||
    Object.keys(body.query).length > 20 ||
    Object.entries(body.query).some(
      ([key, value]) =>
        typeof value !== 'string' ||
        value.length > (key === 'images' ? 4096 : 2048) ||
        /[\uD800-\uDFFF]/u.test(value),
    )
  ) {
    return c.json(
      {
        error: 'Invalid design or showcase confirmation. Reload and try again.',
      },
      400,
    );
  }
  if (redis?.status !== 'ready')
    return c.json(
      {
        error: 'Export storage is unavailable. Please try again shortly.',
      },
      503,
    );
  let options: ReturnType<typeof parseBannerOptions>;
  try {
    options = parseBannerOptions(body.query as Record<string, string>);
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error ? error.message : 'Invalid image settings.',
      },
      400,
    );
  }
  const removalHash = digest(body.removalToken);
  const fingerprint = digest(
    JSON.stringify([
      body.action,
      body.showcase,
      options,
      removalHash,
      SHOWCASE_POLICY,
    ]),
  );
  const entry: Entry = {
    id: body.id,
    createdAt: Date.now(),
    options,
    removalHash,
    fingerprint,
    policyVersion: SHOWCASE_POLICY,
    action: body.action,
    showcased: body.showcase,
    expiresAt: Date.now() + Number(getExportRetentionDays()) * 86400000,
  };
  try {
    // One operation saves the export, optionally publishes it, and counts it once.
    // An existing export prevents retries from re-publishing a withdrawn showcase.
    const keys = usageKeys();
    const result = (await redis.eval(
      `
      local saved = redis.call('GET', KEYS[2])
      local published = redis.call('HGET', KEYS[1], ARGV[1])
      local existing = saved or published
      if existing then
        local entry = cjson.decode(existing)
        if entry.fingerprint ~= ARGV[3] then return {-1} end
        local reason = entry.showcaseReason
        if not reason or reason == '' then reason = published and '' or 'removed' end
        return {0, published and 1 or 0, entry.expiresAt, reason}
      end
      local clock = redis.call('TIME')
      local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
      local submittedAt = tonumber(string.sub(ARGV[1], 1, 13))
      if submittedAt < now - ${NEW_EXPORT_WINDOW_MS} or submittedAt > now + 300000 then return {-2} end
      -- Read before the first write: do not prune first and bypass Redis OOM admission.
      if redis.call('ZCOUNT', KEYS[4], '(' .. now, '+inf') >= ${MAX_EXPORTS} then return {-3} end
      if redis.call('ZCOUNT', KEYS[5], '(' .. (now - 60000), '+inf') >= ${EXPORTS_PER_MINUTE} then return {-4} end
      local kind = redis.call('TYPE', KEYS[3]).ok
      if kind ~= 'none' and kind ~= 'hash' then return redis.error_reply('Invalid usage counters') end
      for _, field in ipairs({'exports', 'showcased'}) do
        local value = tonumber(redis.call('HGET', KEYS[3], field) or '0')
        if not value or value < 0 or value >= 9007199254740991 or value % 1 ~= 0 then return redis.error_reply('Invalid usage count') end
      end
      local entry = cjson.decode(ARGV[2])
      entry.createdAt = now
      entry.expiresAt = now + tonumber(ARGV[4]) * 1000
      local publish = ARGV[5] == 'true' and redis.call('HLEN', KEYS[1]) < 1000
      entry.showcased = publish
      local reason = ARGV[5] == 'true' and not publish and 'full' or ''
      entry.showcaseReason = reason
      local encoded = cjson.encode(entry)
      if string.len(encoded) > ${MAX_EXPORT_BYTES} then return {-5} end
      redis.call('SET', KEYS[2], encoded, 'PXAT', entry.expiresAt)
      if publish then
        local publication = redis.pcall('HSET', KEYS[1], ARGV[1], encoded)
        if type(publication) == 'table' and publication.err then
          redis.call('DEL', KEYS[2])
          return redis.error_reply(publication.err)
        end
      end
      redis.call('ZREMRANGEBYSCORE', KEYS[4], '-inf', now)
      redis.call('ZADD', KEYS[4], entry.expiresAt, ARGV[1])
      redis.call('ZREMRANGEBYSCORE', KEYS[5], '-inf', now - 60000)
      redis.call('ZADD', KEYS[5], now, ARGV[1])
      redis.call('PEXPIRE', KEYS[5], 60000)
      redis.call('HINCRBY', KEYS[3], 'exports', 1)
      if publish then redis.call('HINCRBY', KEYS[3], 'showcased', 1) end
      redis.call('HSETNX', KEYS[3], 'exportsStartedAt', ARGV[6])
      redis.call('EXPIRE', KEYS[3], 604800)
      return {1, publish and 1 or 0, entry.expiresAt, reason}
    `,
      5,
      SHOWCASE_KEY,
      exportKey(entry.id),
      keys.counters,
      EXPORT_INDEX_KEY,
      EXPORT_RATE_KEY,
      entry.id,
      JSON.stringify(entry),
      fingerprint,
      Number(getExportRetentionDays()) * 86400,
      String(body.showcase),
      new Date().toISOString(),
    )) as [number, number, number, string];
    if (result[0] === -2)
      return c.json(
        {
          error:
            'This export request has expired or your device clock is incorrect. Close this dialog, check your clock and start a new export.',
        },
        409,
      );
    if (result[0] === -3 || result[0] === -4) {
      if (result[0] === -4) c.header('Retry-After', '60');
      return c.json(
        {
          error:
            result[0] === -3
              ? 'Export storage is at capacity. No export was saved. Please try again later.'
              : 'Too many new exports. No export was saved. Please try again in a minute.',
        },
        429,
      );
    }
    if (result[0] === -5)
      return c.json({ error: 'This design is too large to save.' }, 413);
    if (result[0] === -1)
      return c.json(
        { error: 'This export was already submitted with different settings.' },
        409,
      );
    return c.json(
      {
        saved: true,
        showcased: result[1] === 1,
        id: entry.id,
        expiresAt: result[2],
        ...(result[1] === 1 ? { previewUrl: `/showcase/${entry.id}.svg` } : {}),
        ...(body.showcase && result[3] ? { showcaseReason: result[3] } : {}),
      },
      result[0] === 1 ? 201 : 200,
    );
  } catch {
    return c.json(
      {
        error:
          'We could not confirm the saved export. Retry with the same choice. If you chose showcasing, you can also use your removal link.',
      },
      503,
    );
  }
});

route.get('/showcase', async (c) => {
  if (!isOfficialInstance())
    return c.json({ enabled: false, entries: [], nextCursor: null });
  const before = c.req.query('before');
  // Timestamp plus ID gives stable pagination when submissions share a millisecond.
  if (before && !/^\d{13}:\d{13}-[a-f0-9-]{36}$/.test(before))
    return c.json({ error: 'Invalid cursor.' }, 400);
  try {
    const redis = getRedis();
    if (redis?.status !== 'ready') throw new Error();
    // ponytail: scan at most 1000 compact records; add an index if gallery volume grows.
    const entries = Object.values(await redis.hgetall(SHOWCASE_KEY))
      .map((raw) => JSON.parse(raw) as Entry)
      .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))
      .filter((entry) => !before || `${entry.createdAt}:${entry.id}` < before);
    const page = entries.slice(0, 12);
    const last = page.at(-1);
    return c.json({
      enabled: true,
      entries: page.map(({ id, createdAt, options }) => ({
        id,
        createdAt,
        label:
          describeBannerText(
            [options.header, options.subheader].filter(Boolean).join(' — '),
          ) || 'Untitled banner',
        previewUrl: `/showcase/${id}.svg`,
      })),
      nextCursor:
        entries.length > 12 && last ? `${last.createdAt}:${last.id}` : null,
    });
  } catch {
    return c.json({ error: 'The showcase is temporarily unavailable.' }, 503);
  }
});

route.get('/showcase/:filename', async (c) => {
  const filename = c.req.param('filename');
  const id = filename.endsWith('.svg') ? filename.slice(0, -4) : '';
  if (!isOfficialInstance() || !exportId.test(id)) return c.notFound();
  try {
    const raw = await getRedis()?.hget(SHOWCASE_KEY, id);
    if (!raw) return c.notFound();
    const entry = JSON.parse(raw) as Entry;
    // Render directly: gallery previews are not banner usage observations.
    const svg = await buildBannerSVG(entry.options);
    c.header(
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; sandbox",
    );
    c.header('X-Content-Type-Options', 'nosniff');
    return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' });
  } catch {
    return c.json({ error: 'Preview unavailable.' }, 503);
  }
});

route.delete('/showcase/:id', async (c) => {
  const id = c.req.param('id');
  if (!isOfficialInstance() || !exportId.test(id)) return c.notFound();
  let token: unknown;
  try {
    token = (await c.req.json()).removalToken;
  } catch {
    /* validated below */
  }
  if (typeof token !== 'string' || !tokenPattern.test(token))
    return c.json({ error: 'Enter a valid removal code.' }, 400);
  try {
    const redis = getRedis();
    if (redis?.status !== 'ready') throw new Error();
    const removed = await redis.eval(
      `
      local entry = redis.call('HGET', KEYS[1], ARGV[1])
      if not entry then
        if redis.call('EXISTS', KEYS[2]) == 1 then return 0 end
        local clock = redis.call('TIME')
        local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
        if tonumber(string.sub(ARGV[1], 1, 13)) >= now - ${NEW_EXPORT_WINDOW_MS} then return -2 end
        return 0
      end
      if cjson.decode(entry).removalHash ~= ARGV[2] then return -1 end
      return redis.call('HDEL', KEYS[1], ARGV[1])
    `,
      2,
      SHOWCASE_KEY,
      exportKey(id),
      id,
      digest(token),
    );
    if (removed === -2)
      return c.json(
        {
          error:
            'This export may still be submitting. Removal is not confirmed. Try this removal link again shortly.',
        },
        409,
      );
    if (removed === -1)
      return c.json(
        { error: 'This removal code does not match the design.' },
        403,
      );
    return c.json({ removed: true });
  } catch {
    return c.json({ error: 'Removal failed. Please try again.' }, 503);
  }
});

export default route;
