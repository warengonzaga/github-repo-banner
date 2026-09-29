// Exercise the shipped browser module, including refresh and unavailable states.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync('src/ui/usage.js', 'utf8');
const flush = () => new Promise(setImmediate);
const snapshot = {
  schemaVersion: 2, enabled: true, available: true, coverage: 'partial',
  window: { day: '2026-09-29', timezone: 'UTC', firstRecordedAt: '2026-09-29T08:00:00Z' },
  recordedBannerRequests: 250, requestsWithRepositoryReferer: 50,
  exports: { total: 8 },
  pageViews: { generator: 200, documentation: 50, usage: 20, total: 270, firstRecordedAt: '2026-09-29T09:00:00Z' },
  estimatedUniqueRepositories: 12, repositoryRefererCoverage: 0.2,
};
const ids = [...readFileSync('src/ui/usage.html', 'utf8').matchAll(/id="(usage-[^"]+)"/g)].map((m) => m[1]);
function setup() {
  const nodes = Object.fromEntries(ids.map((id) => [id, {
    textContent: '', hidden: true, disabled: true, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name]; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, action) { this[name] = action; },
  }]));
  let response = () => Promise.resolve(Response.json(snapshot));
  let calls = 0;
  const context = {
    document: { getElementById: (id) => nodes[id] },
    window: { location: { host: 'banners.example.test' } },
    Intl, Date, AbortSignal,
    fetch: (url, options) => {
      assert.equal(url, '/stats');
      assert.equal(options.cache, 'no-store');
      assert.ok(options.signal instanceof AbortSignal);
      calls++;
      return response();
    },
  };
  runInNewContext(source, context);
  return { nodes, setResponse: (next) => { response = next; }, calls: () => calls };
}
const { nodes, setResponse, calls } = setup();
await flush();
assert.equal(nodes['usage-host'].textContent, 'banners.example.test');
assert.equal(nodes['usage-requests'].textContent, '250');
assert.equal(nodes['usage-exports'].textContent, '8');
assert.equal(nodes['usage-repositories'].textContent, '12');
assert.equal(nodes['usage-coverage'].textContent, '20%');
assert.equal(nodes['usage-page-total'].textContent, '270');
assert.equal(nodes['usage-page-documentation'].textContent, '50');
assert.equal(nodes['usage-results'].hidden, false);
assert.equal(nodes['usage-day'].attributes.datetime, '2026-09-29');
const refresh = () => nodes['usage-refresh'].click();
const noPageOrBannerRequests = { ...snapshot, pageViews: { generator: 0, documentation: 0, usage: 0, total: 0, firstRecordedAt: null }, recordedBannerRequests: 0, requestsWithRepositoryReferer: 0, estimatedUniqueRepositories: 0, repositoryRefererCoverage: null, window: { ...snapshot.window, firstRecordedAt: null } };
for (const [exports, count, title] of [
  [{ total: 0 }, '0', /No observations recorded/],
  [{ total: 3 }, '3', /Latest observations loaded/],
  [undefined, 'Not available', /Latest observations loaded/],
  [{ total: -1 }, 'Not available', /Latest observations loaded/],
]) {
  setResponse(() => Promise.resolve(Response.json({ ...noPageOrBannerRequests, exports })));
  await refresh();
  assert.equal(nodes['usage-exports'].textContent, count);
  assert.match(nodes['usage-state-title'].textContent, title, 'Only confirmed zero exports can produce the empty state');
  assert.equal(nodes['usage-results'].hidden, false);
}
for (const [data, title, hidden] of [
  [{ schemaVersion: 2, enabled: false }, /tracking is off/, true],
  [{ ...snapshot, schemaVersion: 1 }, /unavailable/, true],
  [{ ...snapshot, recordedBannerRequests: -1 }, /unavailable/, true],
  [{ ...snapshot, window: null }, /unavailable/, true],
  [{ ...snapshot, repositoryRefererCoverage: 2 }, /unavailable/, true],
  [{ ...snapshot, pageViews: undefined }, /unavailable/, true],
  [{ ...snapshot, pageViews: { ...snapshot.pageViews, total: -1 } }, /unavailable/, true],
  [{ ...snapshot, pageViews: { ...snapshot.pageViews, total: 999 } }, /unavailable/, true],
  [null, /unavailable/, true],
]) {
  setResponse(() => Promise.resolve(Response.json(data)));
  await refresh();
  assert.match(nodes['usage-state-title'].textContent, title);
  assert.equal(nodes['usage-results'].hidden, hidden);
  assert.equal(nodes['usage-refresh'].disabled, false);
}
for (const response of [() => Promise.resolve(new Response('', { status: 503 })), () => Promise.reject(new Error('offline')), () => Promise.resolve(new Response('not JSON'))]) {
  setResponse(response);
  await refresh();
  assert.match(nodes['usage-state-title'].textContent, /unavailable/);
  assert.equal(nodes['usage-results'].hidden, true, 'old counts must not appear current after errors');
  assert.equal(nodes['usage-refresh'].textContent, 'Try again');
}
let resolve;
setResponse(() => new Promise((done) => { resolve = done; }));
const loading = refresh();
const before = calls();
assert.equal(nodes['usage-refresh'].disabled, true);
assert.equal(nodes['usage-report'].attributes['aria-busy'], 'true');
await refresh();
assert.equal(calls(), before, 'rapid refreshes must not overlap');
resolve(Response.json(snapshot));
await loading;
assert.equal(nodes['usage-results'].hidden, false);
assert.equal(nodes['usage-refresh'].textContent, 'Refresh statistics');
console.log('PASS: usage loading, success, empty, disabled, malformed/error, retry and refresh coalescing; no stale counts');
