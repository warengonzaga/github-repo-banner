import assert from 'node:assert/strict';
import ui from '../src/routes/ui.js';
import stats from '../src/routes/stats.js';

for (const [path, title] of [['/docs', 'Documentation']]) {
  const response = await ui.request(path);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type') || '', /text\/html/);
  const html = await response.text();
  assert.ok(html.includes(`<title>${title} · GitHub Repo Banner</title>`));
  assert.ok(html.includes(`href="${path}" aria-current="page"`));
  assert.ok(html.includes('Skip to content'));
  assert.ok(html.includes('href="/pages.css"'));
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
}
const redirect = await ui.request('/usage');
assert.equal(redirect.status, 301);
assert.equal(redirect.headers.get('location'), '/stats');
assert.equal((await ui.request('/usage.js')).status, 404);
const home = await (await ui.request('/')).text();
assert.ok(home.includes('href="/docs"'));
assert.ok(home.includes('href="/stats"'));
assert.ok(home.includes('/render/banner?'));
assert.ok(!home.includes('<!-- site-navigation -->'));
assert.ok(home.includes('id="readme-tab"'));
const report = await (await stats.request('/stats')).text();
assert.ok(report.includes('Usage tracking is disabled'));
const docs = await (await ui.request('/docs')).text();
assert.ok(docs.includes('360 degrees clockwise'), 'Documentation includes renderer rotation controls');
assert.ok(docs.includes('<code>rotation</code>') && docs.includes('x + w/2, y + h/2'), 'Documentation includes the API field and rotation center');
assert.equal((await ui.request('/docs/../../.env')).status, 404);
console.log('PASS: public pages, canonical stats page, legacy usage redirect and docs');
