// Exercise both capabilities against the production-cached UI template.
import assert from 'node:assert/strict';

const originalKey = process.env.PEXELS_API_KEY;
const originalMode = process.env.NODE_ENV;
process.env.NODE_ENV = 'production';
const { default: uiRoute } = await import('../src/routes/ui.js');

try {
  for (const key of [undefined, '', 'test-pexels-key', undefined]) {
    if (key === undefined) delete process.env.PEXELS_API_KEY;
    else process.env.PEXELS_API_KEY = key;
    const response = await uiRoute.request('/');
    assert.equal(response.status, 200);
    const html = await response.text();
    const section = html.match(/<div id="pexels-section"[^>]*>/)?.[0];
    assert.ok(section);
    assert.equal(section.includes(' hidden'), !key);
    assert.match(html, /<input[^>]*id="bgimg-input"/);
    assert.ok(!html.includes('test-pexels-key'));
  }
  console.log('Pexels UI checks passed: optional search, direct URLs, cached rendering, no key disclosure.');
} finally {
  if (originalKey === undefined) delete process.env.PEXELS_API_KEY;
  else process.env.PEXELS_API_KEY = originalKey;
  if (originalMode === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalMode;
}
