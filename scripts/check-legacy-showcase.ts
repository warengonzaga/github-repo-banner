import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { closeRedis, getRedis, initRedis } from '../src/config/redis.js';
import route from '../src/routes/legacy-showcase.js';

assert.ok(process.env.TEST_REDIS_URL, 'Use the disposable Redis service');
process.env.REDIS_URL = process.env.TEST_REDIS_URL;
const id = `${Date.now()}-${randomUUID()}`;
const token = 'a'.repeat(64);
const removalHash = createHash('sha256').update(token).digest('hex');
const request = (value: unknown, origin = 'http://localhost') =>
  route.request(`/showcase/${id}`, {
    method: 'DELETE',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(value),
  });

await initRedis();
let redis = getRedis()!;
try {
  assert.equal(await redis.hget('showcase:v1:entries', id), null);
  await redis.hset('showcase:v1:entries', id, JSON.stringify({ removalHash }));
  let response = await request({ removalToken: token }, 'https://attacker.example');
  assert.equal(response.status, 403, 'cross-origin deletion is rejected');
  response = await request({ removalToken: token }, 'http://localhost');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { removed: true });
  assert.equal(await redis.hget('showcase:v1:entries', id), null, 'valid code deletes only its legacy entry');
  response = await route.request('/showcase/not-an-id', { method: 'DELETE' });
  assert.equal(response.status, 404);
  response = await request({ removalToken: 'bad' });
  assert.equal(response.status, 400);
  await closeRedis();
  response = await request({ removalToken: token });
  assert.equal(response.status, 503, 'Redis outages are reported without confirming removal');
  console.log('PASS: legacy showcase withdrawal verifies Redis token, origin, and availability');
} finally {
  if (redis.status !== 'ready') {
    await initRedis();
    redis = getRedis()!;
  }
  await redis.hdel('showcase:v1:entries', id);
  await closeRedis();
}
