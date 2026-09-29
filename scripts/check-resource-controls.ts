import assert from 'node:assert/strict';
import { BoundedCache } from '../src/utils/bounded-cache';
import { isValidImageUrl, isPrivateHost } from '../src/ui/image-url.js';
import { resolvePublicImageAddress } from '../src/utils/sanitize';
for (const host of ['::ffff:7f00:1','::ffff:127.0.0.1','fe90::1','febf::1','::','fc00::1','ff02::1','2001:db8::1','localhost.']) {
  assert.ok(isPrivateHost(host), host);
  if (host.includes(':')) assert.equal(isValidImageUrl(`https://[${host}]/x`), false);
}
assert.equal(await resolvePublicImageAddress('::ffff:7f00:1'), null);
assert.equal(await resolvePublicImageAddress('fe90::1'), null);
assert.equal(isValidImageUrl('https://[2606:4700:4700::1111]/x'), true);
const cache = new BoundedCache(20, 1000, 1);
let calls = 0;
let finish!: (v: string) => void;
const load = () => { calls++; return new Promise<string>(resolve => {finish = resolve;}); };
const a = cache.get('a', load), b = cache.get('a', load);
assert.equal(await cache.get('busy', async () => 'bad'), null);
await Promise.resolve(); finish('12345');
assert.deepEqual(await Promise.all([a,b]), ['12345','12345']);
assert.equal(calls,1);
assert.equal(await cache.get('a', load), '12345');
await cache.get('b', async () => '12345'); // Evicts a: combined UTF-16 bytes exceed 20.
assert.equal(await cache.get('a', async () => 'new'), 'new');
const originalNow = Date.now; const now = Date.now();
try { Date.now = () => now + 2000; assert.equal(await cache.get('a', async () => 'expired'), 'expired'); }
finally { Date.now = originalNow; }
await assert.rejects(cache.get('error', async () => {throw Error('failed');}));
assert.equal(await cache.get('error', async () => 'ok'), 'ok');
console.log('PASS: IPv6 literal/DNS rejection, public IPv6, coalescing, concurrency, byte eviction, TTL, failure cleanup');
