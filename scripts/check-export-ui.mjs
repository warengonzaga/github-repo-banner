// Run with node scripts/check-export-ui.mjs. No browser or network required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const source = readFileSync(new URL('../src/ui/export.js', import.meta.url), 'utf8');
const requests = [];
const downloads = [];
let failRender = false;
const feedback = { textContent: '' };
const button = { classList: { add() {}, remove() {} } };
const context = createContext({
  document: {
    getElementById: () => feedback,
    createElement(tag) {
      if (tag === 'canvas') return { getContext: () => ({ drawImage() {} }), toBlob: (callback) => callback(new Blob(['png'])) };
      return { click() { downloads.push(this.download); }, remove() {} };
    },
    body: { append() {} },
  },
  navigator: { clipboard: { writeText: async (text) => { context.copied = text; } } },
  fetch: async (url) => {
    requests.push(url);
    return failRender
      ? new Response('', { status: 503 })
      : new Response('<svg/>', { headers: { 'Content-Type': 'image/svg+xml' } });
  },
  Image: class { async decode() {} },
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
  Blob, AbortSignal, setTimeout() {},
});
runInContext(source.replace('export async function beginExport', 'async function beginExport') + '\nglobalThis.beginExport = beginExport;', context);

await context.beginExport({ action: 'markdown', url: '/render/banner?header=Test', text: '![banner](/render/banner?header=Test)', filename: 'banner' }, button);
assert.equal(context.copied, '![banner](/render/banner?header=Test)');
assert.equal(requests.length, 0, 'copy does not submit design data to the server');
assert.equal(feedback.textContent, 'Copied to clipboard.');
await context.beginExport({ action: 'svg', url: '/render/banner?header=Test', text: '', filename: 'banner' }, button);
assert.deepEqual(requests, ['/render/banner?header=Test']);
assert.deepEqual(downloads, ['banner.svg']);
assert.equal(feedback.textContent, 'Download started.');
await context.beginExport({ action: 'png', url: '/render/banner?header=Test', text: '', filename: 'banner' }, button);
assert.deepEqual(downloads, ['banner.svg', 'banner.png']);
failRender = true;
await context.beginExport({ action: 'svg', url: '/render/banner?header=Test', text: '', filename: 'banner' }, button);
assert.match(feedback.textContent, /could not be rendered/i);
assert.ok(!source.includes("fetch(`/exports"));
console.log('PASS: client-only copy, SVG/PNG export, and render failure feedback');
