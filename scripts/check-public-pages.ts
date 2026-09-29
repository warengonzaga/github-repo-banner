import assert from 'node:assert/strict';
import ui from '../src/routes/ui.js';

for (const [path, title] of [['/docs', 'Documentation'], ['/usage', 'Usage']]) {
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
for (const [path, type] of [['/pages.css', 'text/css'], ['/usage.js', 'text/javascript']]) {
  const response = await ui.request(path);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('Content-Type')?.startsWith(type));
  assert.ok((await response.text()).length > 100);
}
const home = await (await ui.request('/')).text();
assert.ok(home.includes('href="/docs"'));
assert.ok(home.includes('href="/usage"'));
assert.ok(!home.includes('<!-- site-navigation -->'));
assert.ok(home.includes('id="readme-tab"'));
const usage = await (await ui.request('/usage')).text();
const docs = await (await ui.request('/docs')).text();
for (const [, id] of usage.matchAll(/href="\/docs#([^"]+)"/g)) {
  assert.ok(docs.includes(`id="${id}"`), `usage documentation link ${id} must resolve`);
}
assert.ok(usage.includes('href="/stats"'), 'raw API stays accessible');
assert.ok(usage.includes('src="/usage.js"'));
const showcase = usage.match(/<section\b[^>]*id="community-showcase"[^>]*>[\s\S]*?<\/section>/)?.[0];
assert.ok(showcase);
assert.ok(!showcase.includes('<noscript>'), 'The JavaScript fallback must not inherit the hidden showcase section');
assert.match(usage, /<\/section>\s*<noscript><p[^>]*>If community showcasing is enabled on this instance, enable JavaScript/);
assert.equal((await ui.request('/docs/../../.env')).status, 404);
console.log('PASS: public page routes, navigation, single H1, doc cross-links and CSS/JS assets');
