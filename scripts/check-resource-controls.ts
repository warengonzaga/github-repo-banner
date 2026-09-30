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
await new Promise(setImmediate); finish('12345');
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
const queued = new BoundedCache(100,1000,1,2);
const starts:string[]=[];
const releases=new Map<string,(value:string)=>void>();
const deferred=(key:string)=>()=>{starts.push(key);return new Promise<string>(resolve=>releases.set(key,resolve));};
const one=queued.get('one',deferred('one'));
const two=queued.get('two',deferred('two'));
const duplicate=queued.get('two',deferred('duplicate'));
const three=queued.get('three',deferred('three'));
assert.equal(await queued.get('overflow',deferred('overflow')),null,'Queue capacity bounds admitted work');
await new Promise(setImmediate);
assert.deepEqual(starts,['one']);
releases.get('one')!('one'); await one;
const four=queued.get('four',deferred('four'));
await new Promise(setImmediate);
assert.deepEqual(starts,['one','two'],'A newcomer cannot steal the reserved slot');
releases.get('two')!('two'); assert.deepEqual(await Promise.all([two,duplicate]),['two','two']);
await new Promise(setImmediate); assert.deepEqual(starts,['one','two','three']);
releases.get('three')!('three'); await three;
await new Promise(setImmediate); releases.get('four')!('four'); await four;
const failure=queued.get('failure',async()=>{throw new Error('failed');});
const recovery=queued.get('recovery',async()=> 'recovered');
await assert.rejects(failure); assert.equal(await recovery,'recovered','Failures release queued slots');
console.log('PASS: IPv6 literal/DNS rejection, public IPv6, coalescing, concurrency, byte eviction, TTL, bounded queue fairness/coalescing, failure cleanup');
