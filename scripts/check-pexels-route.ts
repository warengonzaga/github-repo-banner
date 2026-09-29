// Disposable Redis only: TEST_REDIS_URL=redis://127.0.0.1:6379 bun scripts/check-pexels-route.ts
// Pexels is a local fixture; no live API key or requests are used.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { closeRedis, getRedis, initRedis, isStatsEnabled } from '../src/config/redis.js';
import banner from '../src/routes/banner.js';
import route from '../src/routes/pexels.js';
import stats from '../src/routes/stats.js';
import { usageKeys } from '../src/utils/usage-stats.js';

// A fresh process must serve a persisted result without touching upstream.
if (process.argv.includes('--cache-reader')) {
  await initRedis();
  try {
    globalThis.fetch = async () => { throw new Error('Persisted cache missed'); };
    assert.equal((await route.request('/api/pexels/search?q=cache%20test&page=2')).status, 200);
    const prefix = 'pexels:v1:' + createHash('sha256').update(process.env.PEXELS_API_KEY!).digest('hex');
    assert.equal(await getRedis()!.zcard(`${prefix}:requests`), Number(process.env.EXPECTED_QUOTA));
  } finally {
    await closeRedis();
  }
  process.exit(0);
}

assert.ok(process.env.TEST_REDIS_URL, 'Set TEST_REDIS_URL to a disposable Redis instance');
process.env.REDIS_URL = process.env.TEST_REDIS_URL;
process.env.ENABLE_STATS = 'false';
const apiKey = `fixture-${randomUUID()}`;
process.env.PEXELS_API_KEY = apiKey;
const prefix = `pexels:v1:${createHash('sha256').update(apiKey).digest('hex')}`;
const quota = `${prefix}:requests`;
const originalFetch = globalThis.fetch;
let calls = 0;
let upstream: Record<string, unknown> = { photos: [], page: 1, total_results: 0 };
let requested = '';
const search = (query: string) => route.request('/api/pexels/search?q=' + encodeURIComponent(query) + '&page=2');
await initRedis();
let redis = getRedis()!;
const usage = usageKeys();
let ownsUsageKeys = false;
try {
  assert.equal(await redis.exists(usage.counters, usage.repositories), 0, 'Use an empty test database; existing usage data will not be changed');
  ownsUsageKeys = true;
  assert.equal(isStatsEnabled(), false);
  globalThis.fetch = async (input, init) => {
    calls++;
    requested = String(input);
    assert.equal(new Headers(init?.headers).get('Authorization'), apiKey);
    await delay(10); // Allow concurrent calls to overlap.
    return Response.json(upstream);
  };
  for (const [count, next, expected] of [[9, true, true], [2, false, false], [0, true, false]] as const) {
    upstream = { page: 2, total_results: 20, photos: Array.from({ length: count }, (_, id) => ({ id, alt: 'Fixture', photographer: 'Test', src: { landscape: 'https://example.com/photo.jpg', medium: 'https://example.com/thumb.jpg' } })), ...(next ? { next_page: 'https://api.pexels.com/v1/search?page=3' } : {}) };
    const response = await search('mountains' + count);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.hasMore, expected);
    assert.equal(body.photos.length, count);
    const url = new URL(requested);
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('per_page'), '9');
    assert.ok(!JSON.stringify(body).includes(apiKey));
  }
  const beforeCache = calls;
  const responses = await Promise.all(Array.from({ length: 8 }, () => search('Cache  Test')));
  assert.ok(responses.every((r) => r.status === 200));
  assert.equal((await search('cache test')).status, 200);
  assert.equal(calls, beforeCache + 1, 'normalized concurrent requests share one upstream call');
  const persistedCount = await redis.zcard(quota);
  const child = spawnSync(process.execPath, ['scripts/check-pexels-route.ts', '--cache-reader'], {
    env: { ...process.env, EXPECTED_QUOTA: String(persistedCount) }, encoding: 'utf8', timeout: 10_000,
  });
  assert.equal(child.status, 0, child.stderr || child.stdout);
  // Reconnect this process too: retained budget and cache remain authoritative.
  await closeRedis();
  await initRedis();
  redis = getRedis()!;
  assert.equal((await search('cache test')).status, 200);
  assert.equal(calls, beforeCache + 1);
  assert.equal(await redis.zcard(quota), persistedCount);
  const cacheKeys = await redis.keys(`${prefix}:cache:*`);
  for (const key of cacheKeys) assert.ok((await redis.ttl(key)) > 0 && (await redis.ttl(key)) <= 300);
  await Promise.all(cacheKeys.map((key) => redis.pexpire(key, 1)));
  await delay(10);
  assert.equal((await search('cache test')).status, 200);
  assert.equal(calls, beforeCache + 2, 'expired data must reload');
  assert.equal((await banner.request('/banner?header=No%20tracking')).status, 200);
  await delay(30);
  assert.equal(await redis.exists(usage.counters, usage.repositories), 0);
  assert.equal((await (await stats.request('/stats')).json()).enabled, false);

  // Only one of four concurrent misses may reserve the final hourly slot.
  await redis.del(quota);
  const [seconds, microseconds] = await redis.time();
  const now = Number(seconds) * 1000 + Math.floor(Number(microseconds) / 1000);
  await redis.zadd(quota, ...Array.from({ length: 99 }, (_, i) => [now, `reserved-${i}`]).flat());
  const concurrent = await Promise.all([0, 1, 2, 3].map((i) => search('last-slot-' + i)));
  assert.equal(concurrent.filter((r) => r.status === 200).length, 1);
  assert.equal(concurrent.filter((r) => r.status === 429).length, 3);
  assert.equal(await redis.zcard(quota), 100);
  assert.ok((await redis.ttl(quota)) > 0 && (await redis.ttl(quota)) <= 3600);
  assert.equal((await search('cache test')).status, 200, 'cache hits work with exhausted quota');
  await closeRedis();
  await initRedis();
  redis = getRedis()!;
  assert.equal((await search('still-limited')).status, 429);
  await redis.zadd(quota, now - 3_600_001, 'reserved-0');
  assert.equal((await search('rolling-expiry')).status, 200);
  assert.equal(await redis.zcard(quota), 100);

  await redis.del(quota);
  upstream = { photos: [{ alt: 'x'.repeat(70_000), src: {} }] };
  assert.equal((await search('oversize')).status, 500);
  upstream = { invalid: true };
  assert.equal((await search('malformed')).status, 500);
  assert.equal(await redis.zcard(quota), 2, 'failed upstream attempts consume budget');
  // Corrupt storage fails closed without calling upstream or resetting the limit.
  await redis.del(quota);
  await redis.set(quota, 'wrong-type');
  const beforeFailure = calls;
  assert.equal((await search('storage-failure')).status, 503);
  assert.equal(calls, beforeFailure);
  await redis.del(quota);

  await closeRedis();
  assert.equal((await search('offline')).status, 503);
  process.env.ENABLE_STATS = 'true';
  await initRedis();
  redis = getRedis()!;
  assert.equal(isStatsEnabled(), true);
  await banner.request('/banner?header=Opted%20out&stats=false');
  for (const headers of [{ DNT: '1' }, { 'Sec-GPC': '1' }]) {
    await banner.request('/banner?header=Opted%20out', { headers });
  }
  await delay(30);
  assert.equal(await redis.exists(usage.counters), 0);
  await banner.request('/banner?header=Tracked', { headers: { Referer: 'https://github.com/fixture/repo' } });
  for (let i = 0; i < 50 && !(await redis.exists(usage.counters)); i++) await delay(10);
  const observed = await (await stats.request('/stats')).json();
  assert.equal(observed.recordedBannerRequests, 1);
  assert.equal(observed.estimatedUniqueRepositories, 1);
  delete process.env.PEXELS_API_KEY;
  assert.equal((await search('missing-key')).status, 503);
  console.log('PASS: real Redis cache/TTL/coalescing, restart persistence, atomic rolling quota, fail-closed storage, tracking off/on and opt-out');
} finally {
  globalThis.fetch = originalFetch;
  if (redis.status === 'ready') {
    const keys = await redis.keys(`${prefix}:*`);
    if (keys.length) await redis.del(...keys);
    if (ownsUsageKeys) await redis.del(usage.counters, usage.repositories);
  }
  await closeRedis();
}
