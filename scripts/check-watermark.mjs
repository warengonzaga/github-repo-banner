// Run with node scripts/check-watermark.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html = readFileSync(new URL('../src/ui/index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('    function buildUrl()'), html.indexOf('    function autoResizeTextarea()'));
const input = { value: '' };
const context = {
  appendBackgroundEffects() {},
  URL, URLSearchParams, headerInput: input, subheaderInput: input, bgImgInput: input,
  headerFontInput: input, subheaderFontInput: input, supportCheckbox: { checked: true },
  getBgHex: () => '000000', getBgHex2: () => '', getColorHex: () => 'ffffff',
  getSubheaderColorHex: () => '', watermarkPosition: 'bottom-right',
  getBackgroundImageUrl: () => '', statsOptOut: { checked: false },
};
for (const position of ['bottom-right', 'bottom-left', 'top-right', 'top-left']) {
  context.watermarkPosition = position;
  const url = new URL(runInNewContext(source + '; buildUrl()', context), 'https://example.com');
  assert.equal(url.searchParams.get('support'), 'true');
  assert.equal(url.searchParams.get('watermarkpos'), position);
}
context.supportCheckbox.checked = false;
const url = new URL(runInNewContext(source + '; buildUrl()', context), 'https://example.com');
assert.equal(url.searchParams.get('support'), 'false');
assert.equal(url.searchParams.has('watermarkpos'), false);
