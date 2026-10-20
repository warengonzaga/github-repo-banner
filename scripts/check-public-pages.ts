import assert from 'node:assert/strict';
import ui from '../src/routes/ui.js';

for (const [path, title] of [['/docs', 'Documentation']]) {
  const response = await ui.request(path);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type') || '', /text\/html/);
  const html = await response.text();
  assert.ok(html.includes(`<title>${title} · GitHub Repo Banner</title>`));
  assert.ok(html.includes('class="site-brand"'));
  assert.ok(!html.includes('<nav class="site-nav"'));
  assert.ok(html.includes('Skip to content'));
  assert.ok(html.includes('href="/pages.css"'));
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
}
assert.equal((await ui.request('/stats')).status, 404);
const legacyRemoval = await ui.request('/usage#remove=old-code');
assert.equal(legacyRemoval.status, 200);
assert.match(await legacyRemoval.text(), /Remove from showcase/);
const home = await (await ui.request('/')).text();
assert.ok(home.includes('class="site-brand"'));
assert.ok(!home.includes('<nav class="site-nav"'));
assert.ok(!home.includes('<h2>Usage stats</h2>'));
assert.ok(home.includes('/render/banner?'));
assert.ok(!home.includes('<!-- site-navigation -->'));
assert.ok(home.includes('id="readme-tab"'));
const docs = await (await ui.request('/docs')).text();
assert.ok(docs.includes('360 degrees clockwise'), 'Documentation includes renderer rotation controls');
assert.ok(docs.includes('<code>rotation</code>') && docs.includes('x + w/2, y + h/2'), 'Documentation includes the API field and rotation center');
assert.equal((await ui.request('/docs/../../.env')).status, 404);
console.log('PASS: public pages and docs');
