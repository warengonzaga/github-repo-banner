// Run with bun scripts/check-usage-stats.ts. No Redis connection required.
import assert from 'node:assert/strict';
import type Redis from 'ioredis';
import { recordBannerRequest, usageKey, usageOptedOut } from '../src/utils/usage-stats.js';

assert.equal(usageKey(new Date('2026-09-29T23:59:59Z')), 'usage:v3:2026-09-29:banner-renders');
assert.ok(usageOptedOut('false', undefined, undefined));
assert.ok(usageOptedOut(undefined, '1', undefined));
assert.ok(usageOptedOut(undefined, undefined, '1'));
assert.equal(usageOptedOut(undefined, undefined, undefined), false);
const calls: unknown[][] = [];
const transaction = {
  incr(...args: unknown[]) { calls.push(['incr', ...args]); return this; },
  expire(...args: unknown[]) { calls.push(['expire', ...args]); return this; },
  exec: async () => [[null, 1], [null, 1]],
};
const redis = { multi: () => transaction } as unknown as Redis;
await recordBannerRequest(redis);
assert.deepEqual(calls, [['incr', usageKey()], ['expire', usageKey(), 604800]]);
console.log('PASS: UTC daily key, opt-outs and bounded aggregate counter');
