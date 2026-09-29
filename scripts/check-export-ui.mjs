// Run with node scripts/check-export-ui.mjs. No browser, network or storage service required.
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const source = readFileSync(new URL('../src/ui/export.js', import.meta.url), 'utf8');
const query = {
  header: 'Full ![github] design', subheader: 'All settings', bg: '123456-654321',
  bgimg: 'https://example.com/photo.png', color: 'abcdef', subheadercolor: 'fedcba',
  headerfont: 'Inter', subheaderfont: 'Roboto', support: 'true', watermarkpos: 'top-left',
  bgblur: '12', bgbrightness: '0', bgcontrast: '130', bgsaturation: '70', bggrayscale: '80', stats: 'false',
};
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const saved = (request, extra = {}) => json(201, { saved: true, id: request.id, showcased: request.showcase, ...extra });
const settle = () => new Promise(setImmediate);

function harness({ official = true, clipboard = 'native', save, failedDownloads = 0 } = {}) {
  const requests = [], renders = [], downloads = [], copies = [];
  const storage = new Map();
  const element = () => ({
    hidden: false, disabled: false, textContent: '', dataset: {}, listeners: {},
    classList: { add() {}, remove() {} },
    setAttribute() {}, remove() {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    click() { if (!this.disabled && !this.hidden) return this.listeners.click?.(); },
  });
  const heading = element(), info = element(), message = element(), receipt = element();
  const link = element(), close = element(), retry = element(), feedback = element();
  const choices = [element(), element()];
  choices[0].dataset.choice = 'no'; choices[1].dataset.choice = 'yes';
  receipt.querySelector = () => link;
  const selectors = { h2: heading, '.official-export-info': info, '.export-status': message,
    '.export-receipt': receipt, '.export-close': close, '.export-retry': retry };
  const dialog = {
    ...element(), open: false,
    set innerHTML(value) { heading.textContent = value.match(/<h2[^>]*>([^<]*)/)[1]; },
    querySelector(selector) { assert.ok(selectors[selector], `Unstubbed selector: ${selector}`); return selectors[selector]; },
    querySelectorAll(selector) { assert.equal(selector, '[data-choice]'); return choices; },
    showModal() { this.open = true; }, close() { this.open = false; },
  };
  const context = createContext({
    document: {
      body: { dataset: { official: String(official), retention: official ? '30' : '' }, append() {} },
      getElementById(id) { assert.equal(id, 'export-feedback'); return feedback; },
      createElement(tag) {
        if (tag === 'dialog') return dialog;
        if (tag === 'canvas') return { getContext: () => ({ drawImage() {} }), toBlob: callback => callback(new Blob(['png'], { type: 'image/png' })) };
        assert.equal(tag, 'a');
        return { ...element(), click() { downloads.push(this.download); } };
      },
    },
    crypto: webcrypto, URL, Blob, Uint8Array, AbortSignal, setTimeout() {},
    Image: class { async decode() { assert.match(this.src, /^data:image\/svg\+xml;charset=utf-8,/, 'SVG conversion must keep the canvas origin-clean'); } },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    navigator: { clipboard: {
      async write(items) { copies.push(await (await items[0].data['text/plain']).text()); },
      async writeText(text) { copies.push(text); },
    } },
    ...(clipboard === 'native' ? { ClipboardItem: class { constructor(data) { this.data = data; } } } : {}),
    async fetch(url, options) {
      if (url.startsWith('/exports')) {
        const request = JSON.parse(options.body);
        requests.push({ url, body: request });
        return save ? save(request, requests.length) : official ? saved(request) : json(200, { showcased: false, counted: false });
      }
      renders.push(url);
      return renders.length <= failedDownloads
        ? new Response('', { status: 503 })
        : new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="304"/>', { headers: { 'Content-Type': 'image/svg+xml' } });
    },
  });
  runInContext(source.replace('export function beginExport', 'function beginExport') + '\nglobalThis.beginExport = beginExport;', context);
  return {
    requests, renders, downloads, copies, heading, info, message, receipt, link, retry, choices, dialog,
    async begin(action = 'url') {
      const url = `https://example.com/banner?${new URLSearchParams(query)}`;
      const text = action === 'markdown' ? `![banner](${url})` : url;
      context.beginExport({ action, url, text, filename: 'banner-full' }, element());
      await settle();
      return { url, text };
    },
    async choose(showcase) { choices[Number(showcase)].click(); await settle(); },
    async retryExport() { await retry.click(); await settle(); },
  };
}

for (const action of ['markdown', 'url', 'svg', 'png']) {
  for (const showcase of [false, true]) {
    const ui = harness();
    const snapshot = await ui.begin(action);
    assert.equal(ui.requests.length, 0, 'Official export waits for an explicit showcase choice');
    await ui.choose(showcase);
    assert.equal(ui.requests.length, 1);
    const request = ui.requests[0];
    assert.equal(request.url, '/exports?stats=false');
    assert.equal(request.body.action, action);
    assert.equal(request.body.showcase, showcase);
    assert.deepEqual(request.body.query, query, 'Both choices save the complete final design');
    assert.equal(request.body.policyVersion, '2026-09-29');
    assert.match(request.body.id, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    assert.match(request.body.removalToken, /^[a-f0-9]{64}$/);
    assert.equal(ui.receipt.hidden, !showcase);
    if (showcase) assert.equal(ui.link.href, `/usage#remove=${request.body.id}.${request.body.removalToken}`);
    if (action === 'markdown' || action === 'url') assert.deepEqual(ui.copies, [snapshot.text]);
    else {
      assert.deepEqual(ui.renders, [snapshot.url]);
      assert.deepEqual(ui.downloads, [`banner-full.${action}`]);
    }
  }
}

for (const reason of ['full', 'removed']) {
  const ui = harness({ clipboard: 'fallback', save: request => saved(request, { showcased: false, showcaseReason: reason }) });
  const snapshot = await ui.begin();
  await ui.choose(true);
  const notice = reason === 'full' ? /showcase is full.*not published/ : /removed.*not republished/;
  assert.match(ui.message.textContent, notice, 'Copy-now preparation retains the actual publication result');
  assert.equal(ui.receipt.hidden, true);
  await ui.retryExport();
  assert.match(ui.message.textContent, notice, 'Copy retry retains the actual publication result');
  assert.deepEqual(ui.copies, [snapshot.text]);
  assert.equal(ui.requests.length, 1);
}

for (const failsFirst of [false, true]) {
  const ui = harness({ official: false, clipboard: 'fallback', save: (_request, attempt) => {
    if (failsFirst && attempt === 1) throw new Error('Temporary network failure');
    return json(200, { showcased: false, counted: false });
  } });
  const snapshot = await ui.begin();
  assert.equal(ui.dialog.open, true);
  assert.equal(ui.heading.textContent, 'Complete your export');
  assert.equal(ui.info.hidden, true, 'Self-hosted fallback does not display official storage claims');
  assert.ok(ui.choices.every(choice => choice.hidden), 'Self-hosted fallback never offers showcasing');
  if (failsFirst) {
    assert.equal(ui.retry.textContent, 'Retry export');
    await ui.retryExport();
  }
  await ui.retryExport();
  assert.deepEqual(ui.copies, [snapshot.text]);
  assert.ok(ui.requests.every(({ body }) => JSON.stringify(body) === JSON.stringify({ action: 'url', showcase: false })), 'Self-hosted exports send no design or showcase choice');
}

{
  const ui = harness({ failedDownloads: 1 });
  await ui.begin('svg');
  await ui.choose(true);
  assert.equal(ui.retry.textContent, 'Retry download');
  assert.equal(ui.requests.length, 1);
  assert.deepEqual(ui.downloads, []);
  await ui.retryExport();
  assert.equal(ui.requests.length, 1, 'Retrying the download does not save or publish again');
  assert.equal(ui.renders.length, 2);
  assert.deepEqual(ui.downloads, ['banner-full.svg']);
}

for (const showcase of [false, true]) {
  const ui = harness({ save: (request, attempt) => {
    if (attempt > 1) return saved(request);
    if (showcase) throw new Error('Response lost');
    return json(503, { error: 'Unconfirmed save' });
  } });
  await ui.begin();
  await ui.choose(showcase);
  assert.match(ui.message.textContent, /Saving may have completed.*Retry the same choice/);
  assert.equal(ui.retry.hidden, true);
  assert.equal(ui.choices[Number(showcase)].disabled, false);
  assert.equal(ui.choices[Number(!showcase)].disabled, true);
  assert.equal(ui.receipt.hidden, !showcase, 'An uncertain showcase still provides its removal capability');
  await ui.choose(!showcase);
  assert.equal(ui.requests.length, 1, 'Opposite choice remains unavailable after an ambiguous save');
  await ui.choose(showcase);
  assert.equal(ui.requests.length, 2);
  assert.deepEqual(ui.requests[1], ui.requests[0], 'Retry reuses the ID, settings, choice and removal token');
  assert.equal(ui.copies.length, 1);
}

console.log('PASS: all export formats and choices save full settings; fallback publication notices, self-hosted controls, download retries and ambiguous-save retries');
