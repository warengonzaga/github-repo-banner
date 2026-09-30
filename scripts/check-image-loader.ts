// Run with bun scripts/check-image-loader.ts. No network connections are made.
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import type { RequestOptions } from 'node:https';
import { mock, spyOn } from 'bun:test';

const MiB = 1024 * 1024;
interface Fixture {
  status?: number;
  type?: string | null;
  length?: string;
  chunks?: Buffer[];
  failure?: 'request' | 'response' | 'aborted';
}
const fixtures = new Map<string, Fixture>();
const requested: string[] = [], resolved: string[] = [];
const responses: Response[] = [];
const address = {address:'203.0.113.9',family:4};
class Response extends EventEmitter {
  destroyed = false;
  statusCode: number;
  headers: Record<string,string>;
  constructor(fixture: Fixture) {
    super();
    this.statusCode = fixture.status ?? 200;
    this.headers = {};
    if (fixture.type !== null) this.headers['content-type'] = fixture.type ?? 'image/png';
    if (fixture.length) this.headers['content-length'] = fixture.length;
  }
  destroy() { this.destroyed = true; }
}
mock.module('../src/utils/sanitize.js', () => ({
  resolvePublicImageAddress: async (hostname: string) => {
    resolved.push(hostname);
    return hostname === 'blocked.example.com' ? null : address;
  },
}));
const transport = {
  request(url: URL, options: RequestOptions, callback: (response: Response) => void) {
    const fixture = fixtures.get(url.pathname);
    assert.ok(fixture, `Unexpected request: ${url.href}`);
    requested.push(url.pathname);
    assert.ok(options.signal instanceof AbortSignal, 'Every transfer has an abort deadline');
    assert.ok(options.lookup, 'HTTPS uses the address validated before the request');
    options.lookup('rebound.example.com', {all:true}, (error, addresses) => {
      assert.equal(error,null); assert.deepEqual(addresses,[address]);
    });
    options.lookup('rebound.example.com', {}, (error, host, family) => {
      assert.equal(error,null); assert.equal(host,address.address); assert.equal(family,address.family);
    });
    const request = new EventEmitter() as EventEmitter & {end:()=>void};
    request.end = () => queueMicrotask(() => {
      if (fixture.failure === 'request') { request.emit('error',new Error('connection failed')); return; }
      const response = new Response(fixture);
      responses.push(response);
      callback(response);
      if (response.destroyed) return;
      for (const chunk of fixture.chunks ?? []) {
        response.emit('data',chunk);
        if (response.destroyed) return;
      }
      if (fixture.failure === 'response') response.emit('error',new Error('stream failed'));
      else if (fixture.failure === 'aborted') response.emit('aborted');
      else response.emit('end');
    });
    return request;
  },
};
// Bun 1.3 does not replace this built-in with mock.module; spy on its shared export.
const https = require('node:https');
spyOn(https, 'request').mockImplementation(transport.request);
assert.equal((await import('node:https')).request, https.request, 'Transport is intercepted before loading production code');
const {fetchImageAsBase64} = await import('../src/banner/image-loader.js');
const url = (path: string) => `https://images.example.com${path}`;
const bytes = (uri: string | null) => {
  assert.ok(uri);
  return Buffer.from(uri.slice(uri.indexOf(',') + 1),'base64').byteLength;
};

fixtures.set('/large.png',{chunks:[Buffer.alloc(MiB),Buffer.from([1])]});
assert.equal(bytes(await fetchImageAsBase64(url('/large.png'))),MiB + 1,'Background default permits more than 1 MiB');
assert.equal(await fetchImageAsBase64(url('/large.png'),MiB),null,'Custom image limit cannot reuse a larger background cache entry');
assert.equal(responses.at(-1)?.destroyed,true,'Streamed overflow stops the response');
assert.equal(requested.length,2,'Different limits use separate cache entries');
assert.equal(bytes(await fetchImageAsBase64(url('/large.png'))),MiB + 1);
assert.equal(requested.length,2,'Same-limit cache hits avoid a second download');
fixtures.set('/large.png',{chunks:[Buffer.from('now small')]});
assert.equal(bytes(await fetchImageAsBase64(url('/large.png'),MiB)),9,'A failed strict load is retryable');
assert.equal(requested.length,3);
fixtures.set('/boundary.png',{length:String(MiB),chunks:[Buffer.alloc(MiB)]});
assert.equal(bytes(await fetchImageAsBase64(url('/boundary.png'),MiB)),MiB,'Exact custom byte limit is accepted');

for (const [path,fixture,budget] of [
  ['/declared.png',{length:String(MiB+1)},MiB],
  ['/default-too-large.png',{length:String(10*MiB+1)},undefined],
  ['/svg',{type:'image/svg+xml',chunks:[Buffer.from('<svg/>')]},MiB],
  ['/html',{type:'text/html',chunks:[Buffer.from('<html/>')]},MiB],
  ['/missing-type',{type:null,chunks:[Buffer.from('bytes')]},MiB],
  ['/redirect',{status:302,chunks:[]},MiB],
] as [string,Fixture,number|undefined][]) {
  fixtures.set(path,fixture);
  const count = requested.length;
  assert.equal(await fetchImageAsBase64(url(path),budget),null,path);
  assert.equal(responses.at(-1)?.destroyed,true,`${path}: reject before consuming the body`);
  assert.equal(requested.length,count+1,'No redirect follow-up request');
}
for (const failure of [undefined,'request','response','aborted'] as const) {
  const path = `/failure-${failure}`;
  fixtures.set(path,{failure,chunks:[]});
  assert.equal(await fetchImageAsBase64(url(path),MiB),null,'Empty or interrupted responses fail closed');
}
fixtures.set('/mime-parameters',{type:'IMAGE/WEBP; charset=binary',chunks:[Buffer.from('raster')]});
assert.match((await fetchImageAsBase64(url('/mime-parameters'),MiB))!,/^data:image\/webp;base64,/);
const beforeRequests = requested.length, beforeResolutions = resolved.length;
for (const invalid of ['http://images.example.com/a','https://user:pass@images.example.com/a']) {
  assert.equal(await fetchImageAsBase64(invalid,MiB),null);
}
assert.equal(resolved.length,beforeResolutions,'Invalid protocol/credentials never reach DNS');
assert.equal(await fetchImageAsBase64('https://blocked.example.com/a',MiB),null);
assert.equal(requested.length,beforeRequests,'A rejected DNS address never reaches transport');
console.log('PASS: custom/default byte budgets, limit-aware caching, streamed overflow, raster MIME, redirects, empty/error bodies and DNS-pinned transport');
console.log('Transport is mocked; timeout wiring is present but elapsed-time cancellation is not exercised.');
