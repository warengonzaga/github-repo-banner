// Run with bun scripts/check-usage-stats.ts. No Redis connection required.
import assert from 'node:assert/strict';
import type Redis from 'ioredis';
import { recordBannerRequest, repositoryFromReferer, usageKeys, usageOptedOut } from '../src/utils/usage-stats.js';
assert.equal(repositoryFromReferer('https://github.com/Owner/Repo/tree/main?x=1#readme'), 'owner/repo');
for (const value of ['', 'https://evilgithub.com/a/b', 'https://github.com.evil.test/a/b', 'https://github.com/settings/profile', 'https://github.com/a', 'http://github.com/a/b']) {
  assert.equal(repositoryFromReferer(value), null);
}
assert.ok(usageOptedOut('false', undefined, undefined));
assert.ok(usageOptedOut(undefined, '1', undefined));
assert.ok(usageOptedOut(undefined, undefined, '1'));
assert.equal(usageOptedOut(undefined, undefined, undefined), false);
assert.equal(usageKeys(new Date('2026-09-29T23:59:59Z')).day, '2026-09-29');
const calls: unknown[][] = [];
const transaction = {
  hincrby(...args: unknown[]) { calls.push(['hincrby', ...args]); return this; },
  hsetnx(...args: unknown[]) { calls.push(['hsetnx', ...args]); return this; },
  expire(...args: unknown[]) { calls.push(['expire', ...args]); return this; },
  pfadd(...args: unknown[]) { calls.push(['pfadd', ...args]); return this; },
  exec: async () => [[null, 1]],
};
const redis = { multi: () => transaction } as unknown as Redis;
await recordBannerRequest(redis, 'https://github.com/Owner/Repo');
assert.ok(calls.some(call => call[0] === 'hincrby' && call[2] === 'requests'));
assert.ok(calls.some(call => call[0] === 'hincrby' && call[2] === 'repositoryRequests'));
assert.match(String(calls.find(call => call[0] === 'pfadd')?.[2]), /^[a-f0-9]{64}$/);
assert.ok(!JSON.stringify(calls).includes('owner/repo'));
calls.length = 0;
await recordBannerRequest(redis, '');
assert.ok(calls.some(call => call[0] === 'hincrby' && call[2] === 'requests'));
assert.ok(!calls.some(call => call[0] === 'pfadd'));
