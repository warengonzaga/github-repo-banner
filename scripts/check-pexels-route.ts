// Run with bun scripts/check-pexels-route.ts. No live Pexels key required.
import assert from 'node:assert/strict';
import route from '../src/routes/pexels.js';
const originalFetch = globalThis.fetch;
const originalKey = process.env.PEXELS_API_KEY;
process.env.PEXELS_API_KEY = 'fixture-key';
let requested = '';
let upstream: Record<string, unknown> = {};
try {
  globalThis.fetch = async (input, init) => {
    requested = String(input);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'fixture-key');
    return Response.json(upstream);
  };
  for (const [count, next, expected] of [[9, true, true], [2, false, false], [0, true, false]] as const) {
    upstream = { page: 2, total_results: 20, photos: Array.from({ length: count }, (_, id) => ({ id, alt: 'Fixture', photographer: 'Test', src: { landscape: 'https://example.com/photo.jpg', medium: 'https://example.com/thumb.jpg' } })), ...(next ? { next_page: 'https://api.pexels.com/v1/search?page=3' } : {}) };
    const response = await route.request('/api/pexels/search?q=mountains'+count+'&page=2');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.hasMore, expected);
    assert.equal(body.photos.length, count);
    const url = new URL(requested);
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('per_page'), '9');
    assert.equal(url.searchParams.get('query'), 'mountains'+count);
    assert.ok(!JSON.stringify(body).includes('fixture-key'));
  }
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ photos: [], page: 1, total_results: 0 }); };
  assert.equal((await route.request('/api/pexels/search?q=Cache%20%20Test')).status, 200);
  assert.equal((await route.request('/api/pexels/search?q=cache%20test')).status, 200);
  assert.equal(calls, 1, 'normalized repeated query must be cached');
  let limited = false;
  for (let i = 0; i < 110; i++) {
    const response = await route.request('/api/pexels/search?q=budget' + i);
    if (response.status === 429) { limited = true; break; }
  }
  assert.ok(limited);
  assert.ok(calls <= 100, 'upstream calls bounded by hourly budget');
  delete process.env.PEXELS_API_KEY;
  assert.equal((await route.request('/api/pexels/search?q=mountains')).status, 503);
  console.log('PASS: server page forwarding, pagination metadata, empty-page termination and private API key');
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.PEXELS_API_KEY;
  else process.env.PEXELS_API_KEY = originalKey;
}
