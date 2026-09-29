// Run with node scripts/check-background-controls.mjs.
import { isValidImageUrl } from '../src/ui/image-url.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html = readFileSync(new URL('../src/ui/index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('    function getBackgroundImageUrl()'), html.indexOf('    function buildUrl()'));
const groups = [{}, {}, {}];
let writes = 0;
let message;
const status = { get textContent() { return message; }, set textContent(value) { message = value; writes++; } };
const input = { value: '' };
const context = { isValidImageUrl, URL, bgImgInput: input, document: {
  querySelectorAll: () => groups, getElementById: () => status,
}};
for (const [value, disabled] of [
  ['https://images.pexels.com/photo.jpg', true], ['', false],
  ['https://localhost/private.png', false], ['https://10.0.0.1/a.png', false],
  ['https://host.internal/a.png', false], ['https://[::1]/a.png', false],
  ['not a URL', false], ['http://example.com/a.png', false],
  ['https://user:password@example.com/a.png', false],
]) {
  input.value = value;
  runInNewContext(source + '; updateBackgroundControls()', context);
  assert.ok(groups.every(group => group.disabled === disabled));
  assert.match(status.textContent, disabled ? /Clear the image URL/ : /available/);
}

const before = writes;
runInNewContext(source + '; updateBackgroundControls(); updateBackgroundControls()', context);
assert.equal(writes, before, 'unchanged status must not be rewritten');
