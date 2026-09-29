// TEST_REDIS_URL must point to an empty, disposable Redis database.
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { Hono } from 'hono';
import { closeRedis, getRedis, initRedis } from '../src/config/redis.js';
import stats from '../src/routes/stats.js';
import ui from '../src/routes/ui.js';
import { isUsageRecordingAvailable, usageKeys } from '../src/utils/usage-stats.js';

assert.ok(process.env.TEST_REDIS_URL, 'Use a disposable Redis database');
process.env.REDIS_URL = process.env.TEST_REDIS_URL;
process.env.ENABLE_STATS = 'false';
await initRedis();
let redis = getRedis()!;
const keys = usageKeys();
const app = new Hono().route('/', ui).route('/', stats);
const snapshot = async () => (await app.request('/stats')).json();
let ownsKeys = false;
try {
  assert.equal(await redis.exists(keys.counters, keys.repositories), 0, 'Existing usage data will not be changed');
  ownsKeys = true;
  for (const path of ['/', '/docs', '/usage']) await app.request(path);
  await delay(30);
  assert.equal(await redis.exists(keys.counters), 0, 'disabled tracking writes nothing');
  await closeRedis();
  process.env.ENABLE_STATS = 'true';
  await initRedis();
  redis = getRedis()!;
  assert.equal((await snapshot()).pageViews.total, 0);
  for (const path of ['/', '/docs', '/usage']) {
    await app.request(`${path}?stats=false`);
    await app.request(path, { headers: { DNT: '1' } });
    await app.request(path, { headers: { 'Sec-GPC': '1' } });
    await app.request(path, { method: 'HEAD' });
  }
  for (const path of ['/stats', '/stats', '/pages.css', '/usage.js', '/image-url.js', '/missing']) await app.request(path);
  await delay(30);
  assert.equal(await redis.exists(keys.counters), 0, 'opt-outs, HEAD, assets, API and 404s do not count');
  for (const path of ['/', '/docs', '/usage', '/docs?example=1']) assert.equal((await app.request(path)).status, 200);
  for (let i = 0; i < 50 && (await snapshot()).pageViews.total !== 4; i++) await delay(10);
  const observed = await snapshot();
  assert.deepEqual(observed.pageViews, { generator: 1, documentation: 2, usage: 1, total: 4, firstRecordedAt: observed.pageViews.firstRecordedAt });
  assert.ok(Number.isFinite(Date.parse(observed.pageViews.firstRecordedAt)));
  assert.equal(observed.recordedBannerRequests, 0);
  assert.equal(observed.window.firstRecordedAt, null, 'page views must not change the banner measurement window');
  assert.equal(await redis.exists(keys.repositories), 0, 'page views store no visitor or repository identity');
  assert.ok((await redis.ttl(keys.counters)) > 0 && (await redis.ttl(keys.counters)) <= 604800);
  await redis.hset(keys.counters, 'page:usage', '-1');
  assert.equal((await app.request('/stats')).status, 503, 'corrupt counts fail closed');
  await redis.del(keys.counters);
  await redis.set(keys.counters, 'wrong-type');
  assert.equal((await app.request('/docs')).status, 200, 'recording failure must not break documentation');
  for (let i = 0; i < 50 && isUsageRecordingAvailable(); i++) await delay(10);
  assert.equal(isUsageRecordingAvailable(), false);
  assert.equal((await app.request('/stats')).status, 503);
  console.log('PASS: daily page counts, opt-outs, disabled tracking, exclusions, separate windows, retention and failed writes');
} finally {
  if (ownsKeys && redis.status === 'ready') await redis.del(keys.counters, keys.repositories);
  await closeRedis();
}
