// Run with node scripts/check-pexels.mjs. No live Pexels key required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../src/ui/index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('    async function searchPexels()'), html.indexOf("    pexelsSearchBtn.addEventListener"));
for (const [response, message] of [
  [{ status: 503 }, /not enabled/],
  [{ status: 502, ok: false }, /unavailable right now/],
  [{ status: 200, ok: true, json: async () => ({ photos: [] }) }, /No images found/],
  [null, /unavailable right now/],
]) {
  const element = () => ({ style: {}, textContent: '', innerHTML: '' });
  const context = {
    pexelsQuery: { value: 'mountains' }, pexelsSearchBtn: element(),
    pexelsResults: element(), pexelsAttribution: element(),
    pexelsClearBtn: element(), pexelsStatus: element(), AbortSignal,
    fetch: async () => { if (!response) throw new Error('offline'); return response; },
  };
  await runInNewContext(source + '; searchPexels()', context);
  assert.match(context.pexelsStatus.textContent, message);
  assert.equal(context.pexelsSearchBtn.disabled, false);
  assert.equal(context.pexelsAttribution.style.display, 'none');
}
