// Run with bun scripts/check-documentation.ts; no server or database required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import { renderDocumentation } from '../src/ui/documentation.js';
import { escapeXml } from '../src/utils/sanitize.js';

const readDocument = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const defaultMarkdown = marked.parse('# Unmodified renderer\n\n[Link](README.md)', { async: false });
const html = renderDocumentation(readDocument);

function checkAnchors(markup: string) {
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Every heading has a unique ID');
  for (const [, fragment] of markup.matchAll(/href="#([^"]*)"/g)) {
    assert.ok(ids.includes(fragment), `Broken internal fragment: ${fragment}`);
  }
  assert.equal((markup.match(/<h1\b/g) ?? []).length, 1, 'The page has exactly one H1');
}

checkAnchors(html);
for (const chapter of ['overview', 'api', 'self-hosting', 'contributing', 'code-of-conduct', 'license']) {
  assert.match(html, new RegExp(`<h2[^>]*id="${chapter}"`));
}
for (const content of ['Background Effects', 'Resource limits', 'Enforcement Guidelines', 'Clean Commit', 'schemaVersion', 'HyperLogLog']) {
  assert.ok(html.includes(content), `Missing canonical content: ${content}`);
}
assert.ok(html.includes(escapeXml(readDocument('LICENSE'))), 'The complete license remains intact');
assert.match(html, /href="#overview--privacy--transparency"/);
assert.match(html, /href="#contributing--commit-convention"/);
assert.match(html, /href="#api-parameters"/);
assert.match(html, /href="#self-hosting-resource-limits"/);
assert.match(html, /href="https:\/\/github.com\/warengonzaga\/github-repo-banner\/blob\/main\/\.env.example"/);
assert.match(html, /href="https:\/\/github.com\/warengonzaga\/github-repo-banner\/tree\/main\/skills\/github-repo-banner"/);
assert.doesNotMatch(html, /repository-document:|\]\((?:\.\.\/)?(?:README\.md|docs\/api\.md)/);
assert.match(html, /<details class="docs-toc-mobile"><summary>On this page<\/summary>/);
for (const [image] of html.matchAll(/<img\b[^>]*>/g)) {
  assert.match(image, /loading="lazy"/);
  if (image.includes('ghrb.waren.build/banner')) {
    assert.match(image, /[?&]amp;stats=false|\?stats=false/);
    assert.match(image, /width="1280" height="304"/);
  }
}
assert.equal((html.match(/<table>/g) ?? []).length, (html.match(/class="table-scroll" role="region" aria-label="[^"]+" tabindex="0"/g) ?? []).length);

const fixture = renderDocumentation((path) => path === 'README.md' ? `# Original title

[Title](#original-title) [Repeated](#same-heading-1) [Nested](docs/api.md#api-reference)
[File](docs/../.env.example) [Mail](mailto:test@example.com)

## **Same** _heading_
## Same heading
## Same heading-1
## [Nested **format**](https://example.com) and \`code\`
## 🔒 Privacy & Transparency
## **Fish &amp;amp; chips**
## \`A &amp; B\`
## !!!
## section
###### Deep heading

[Nested heading](#nested-format-and-code) [Privacy](#-privacy--transparency)
[Entity](#fish-amp-chips) [Code entity](#a-amp-b) [Encoded](#%2Dprivacy%2D%2Dtransparency)

![<Alt & text>](https://ghrb.waren.build/banner?header=Example&stats=true "A & B")
` : readDocument(path));
checkAnchors(fixture);
assert.match(fixture, /id="overview-same-heading"/);
assert.match(fixture, /id="overview-same-heading-1"/);
assert.match(fixture, /id="overview-same-heading-1-1"/);
assert.match(fixture, /id="overview-fish-amp-chips"/);
assert.match(fixture, /id="overview-section-1"/);
assert.match(fixture, /href="#overview"[^>]*>Title/);
assert.match(fixture, /href="#api"[^>]*>Nested/);
assert.match(fixture, /<h6 id="overview-deep-heading"/);
assert.match(fixture, /alt="&lt;Alt &amp; text&gt;"/);
assert.match(fixture, /title="A &amp; B"/);
assert.match(fixture, /href="mailto:test@example.com"/);
assert.equal(marked.parse('# Unmodified renderer\n\n[Link](README.md)', { async: false }), defaultMarkdown, 'Documentation rendering must not mutate global marked settings');
console.log('Documentation rendering checks passed');
