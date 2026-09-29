// Run with node scripts/check-background-controls.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html = readFileSync(new URL('../src/ui/index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('    function getBackgroundImageUrl()'), html.indexOf('    function buildUrl()'));
const groups = [{}, {}, {}];
const status = {};
const input = { value: '' };
const context = { URL, bgImgInput: input, document: {
  querySelectorAll: () => groups, getElementById: () => status,
}};
for (const [value, disabled] of [
  ['https://images.pexels.com/photo.jpg', true], ['', false],
  ['not a URL', false], ['http://example.com/a.png', false],
  ['https://user:password@example.com/a.png', false],
]) {
  input.value = value;
  runInNewContext(source + '; updateBackgroundControls()', context);
  assert.ok(groups.every(group => group.disabled === disabled));
  assert.match(status.textContent, disabled ? /Clear the image URL/ : /available/);
}
