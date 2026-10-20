import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mock } from 'bun:test';

let redisStatus = 'ready';
let deleteResult: number = 1;
const evalCalls: unknown[][] = [];
const redis = {
  get status() { return redisStatus; },
  eval: async (...args: unknown[]) => { evalCalls.push(args); return deleteResult; },
};
mock.module('../src/config/redis.js', () => ({ getRedis: () => redis }));
const { default: route } = await import('../src/routes/legacy-showcase.js');

const id = `${String(Date.now() - 20 * 60_000)}-aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee`;
const token = 'a'.repeat(64);
const request = (body: unknown, headers: Record<string, string> = {}) =>
  route.request(`/showcase/${id}`, {
    method: 'DELETE',
    headers: { origin: 'http://localhost', 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

let response = await request({ removalToken: token });
assert.equal(response.status, 200);
assert.deepEqual(await response.json(), { removed: true });
assert.equal(evalCalls[0].length, 5);
assert.equal(evalCalls[0][1], 1);
assert.equal(evalCalls[0][2], 'showcase:v1:entries');
assert.equal(evalCalls[0][3], id);
assert.equal(
  evalCalls[0][4],
  createHash('sha256').update(token).digest('hex'),
);

response = await request({ removalToken: token }, { origin: 'https://attacker.example' });
assert.equal(response.status, 403, 'cross-origin deletion is rejected');
response = await request({ removalToken: token }, { 'content-type': 'text/plain' });
assert.equal(response.status, 403, 'non-JSON deletion is rejected');
response = await route.request('/showcase/not-an-id', { method: 'DELETE' });
assert.equal(response.status, 404);
response = await request({ removalToken: 'bad' });
assert.equal(response.status, 400);

deleteResult = -1;
response = await request({ removalToken: token });
assert.equal(response.status, 403, 'a mismatched code cannot remove a design');
redisStatus = 'offline';
response = await request({ removalToken: token });
assert.equal(response.status, 503);
console.log('PASS: legacy showcase withdrawal validates origin, code, and Redis state');
