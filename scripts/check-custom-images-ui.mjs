// Run with node scripts/check-custom-images-ui.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { initImageLayers } from '../src/ui/image-layers.js';
import { CUSTOM_ICON_SOURCE, INLINE_ICON_SOURCE, validateCustomIcons, sanitizeBannerText } from '../src/ui/inline-icons.js';

// The native controls are represented minimally; production event handlers do all mutations.
let focused;
class Element {
  children = []; listeners = {}; attributes = {}; value = ''; disabled = false; dataset = {};
  constructor(tag = '') { this.tag = tag; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  emit(name) { this.listeners[name]?.({}); }
  focus() { focused = this; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  append(child) { child.remove(); child.parent = this; this.children.push(child); }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  checkValidity() { const n = Number(this.value); return this.value !== '' && Number.isFinite(n) && Number.isInteger(n) && n >= Number(this.min) && n <= Number(this.max); }
  set innerHTML(html) {
    this.children = [];
    for (const match of html.matchAll(/<(input|button|select|legend)\b([^>]*)>/g)) {
      const child = new Element(match[1]);
      for (const [, key, value] of match[2].matchAll(/([\w-]+)="([^"]*)"/g)) {
        if (key.startsWith('data-')) child.dataset[key.slice(5)] = value;
        else child[key] = value;
      }
      child.checked = /\bchecked\b/.test(match[2]);
      if (child.tag === 'select') child.value = 'behind';
      this.append(child);
    }
  }
  querySelectorAll(selector) {
    const [, tag, attr, value] = /^(\w+)?(?:\[([\w-]+)="([^"]*)"\])?$/.exec(selector);
    return this.children.filter(child => (!tag || child.tag === tag) && (!attr || (attr.startsWith('data-') ? child.dataset[attr.slice(5)] : child[attr]) === value));
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}
const originalDocument = globalThis.document;
globalThis.document = { createElement: tag => new Element(tag) };
try {
  const container = new Element(), addButton = new Element(), status = new Element();
  let inline = 0, changes = 0;
  const editor = initImageLayers({container, addButton, status, getInlineCount: () => inline, onChange: () => { changes++; }});
  const row = index => container.children[index];
  const src = index => row(index).querySelector('input[type="url"]');
  const controls = index => row(index).querySelectorAll('input[type="number"]');
  assert.equal(editor.serialize(), '');
  addButton.emit('click');
  assert.equal(focused, src(0));
  assert.throws(() => editor.serialize(), /enter a public HTTPS/);
  src(0).value = 'https://example.com/one.png';
  assert.deepEqual(JSON.parse(editor.serialize()), [{src:src(0).value,x:0,y:0,w:128,h:128,fit:'contain',placement:'behind'}]);
  controls(0)[0].value = '320'; controls(0)[1].value = '80';
  controls(0)[2].value = '200'; controls(0)[3].value = '64';
  row(0).querySelector('input[type="checkbox"]').checked = false;
  row(0).emit('input');
  assert.deepEqual(JSON.parse(editor.serialize())[0], {src:src(0).value,x:320,y:80,w:200,h:64,fit:'stretch',placement:'behind'});
  const rotation = row(0).querySelector('input[name="rotation"]');
  assert.equal(rotation.value,'0');
  rotation.value='45'; row(0).emit('input');
  assert.equal(JSON.parse(editor.serialize())[0].rotation,45);
  for(const invalid of ['', '-1', '361', 'not-a-number']) {
    rotation.value=invalid;
    assert.throws(()=>editor.serialize(),/Rotation must be between 0 and 360 degrees/);
    assert.equal(rotation.attributes['aria-invalid'],'true');
  }
  rotation.value='360'; assert.equal(JSON.parse(editor.serialize())[0].rotation,360);
  assert.equal(rotation.attributes['aria-invalid'],undefined);
  rotation.value='0'; assert.equal('rotation' in JSON.parse(editor.serialize())[0],false);
  rotation.value='45';
  controls(0)[2].value = '';
  assert.throws(() => editor.serialize(), /Width must be/);
  controls(0)[2].value = '200';
  src(0).value = 'https://localhost/private.png';
  assert.throws(() => editor.serialize(), /public HTTPS/);
  assert.equal(src(0).attributes['aria-invalid'],'true');
  src(0).value = 'https://example.com/one.png';
  addButton.emit('click'); src(1).value = 'https://example.com/two.png';
  const first = row(0);
  first.querySelector('[data-action="raise"]').emit('click');
  assert.equal(JSON.parse(editor.serialize())[1].rotation,45,'Reordering preserves the image angle');
  assert.equal(row(1), first, 'Reorder moves existing controls without recreating input values');
  assert.deepEqual(JSON.parse(editor.serialize()).map(image => image.src), ['https://example.com/two.png','https://example.com/one.png']);
  assert.equal(focused, src(1), 'Focus remains in the moved image when its action reaches the boundary');
  row(1).querySelector('select').value = 'front'; row(1).emit('input');
  assert.equal(JSON.parse(editor.serialize())[1].placement, 'front');
  assert.equal(row(1).querySelector('[data-action="lower"]').disabled, true, 'Order controls stay within the selected text position');
  inline = 3; editor.refreshLimit();
  assert.equal(addButton.disabled, true);
  addButton.emit('click'); assert.equal(container.children.length, 2);
  inline = 4;
  assert.throws(() => editor.serialize(), /at most 5/);
  inline = 0; editor.refreshLimit();
  first.querySelector('[data-action="remove"]').emit('click');
  assert.equal(container.children.length, 1); assert.equal(focused, src(0));
  assert.ok(changes >= 6);

  const html = readFileSync(new URL('../src/ui/index.html', import.meta.url), 'utf8');
  const blank = {value:''}, handlers = {}, snapshots = [], errors = [];
  const button = action => ({addEventListener: (_name, fn) => { handlers[action] = fn; }});
  const context = createContext({
    URL,URLSearchParams,INLINE_ICON_SOURCE,CUSTOM_ICON_SOURCE,validateCustomIcons,sanitizeBannerText,imageLayers:editor,
    headerInput:{value:'![icon src="https://example.com/inline.png" w="100%"] Hello'},subheaderInput:blank,
    headerFontInput:blank,subheaderFontInput:blank,supportCheckbox:{checked:true},statsOptOut:{checked:false},watermarkPosition:'top-left',
    getBackgroundImageUrl:()=>'',getBgHex:()=> '112233',getBgHex2:()=>'',getColorHex:()=> 'ffffff',getSubheaderColorHex:()=>'',appendBackgroundEffects(){},
    window:{location:{origin:'https://example.com'}},copyBtn:button('markdown'),copyUrlBtn:button('url'),downloadBtn:button('svg'),downloadPngBtn:button('png'),
    beginExport: snapshot => snapshots.push(snapshot),requireReadyPreview(){},setDesignError: error => errors.push(error),designError:{scrollIntoView(){}},
  });
  runInContext(html.slice(html.indexOf('    function buildUrl()'),html.indexOf('    function autoResizeTextarea()')),context);
  runInContext(html.slice(html.indexOf('    function extractIcons('),html.indexOf('    function validateInput(')),context);
  assert.equal(runInContext('getDisplayText(headerInput.value)',context),' Hello');
  assert.equal(runInContext('extractIcons(headerInput.value)[0].name',context),'custom icon');
  runInContext(html.slice(html.indexOf('    for (const [button, action]'),html.indexOf('    updateBackgroundEffectControls();',html.indexOf('    for (const [button, action]'))),context);
  for (const action of ['markdown','url','svg','png']) {
    controls(0)[0].value = String(100 + snapshots.length);
    row(0).querySelector('input[name="rotation"]').value = String(30 + snapshots.length);
    handlers[action]();
    const snapshot = snapshots.at(-1), url = new URL(snapshot.url);
    assert.equal(snapshot.action,action);
    assert.equal(JSON.parse(url.searchParams.get('images'))[0].rotation,30 + snapshots.length - 1,'Every export carries the current angle');
    assert.equal(snapshot.filename,'banner-hello','Download names exclude image URLs and attributes');
    assert.equal(JSON.parse(url.searchParams.get('images'))[0].x,100 + snapshots.length - 1,'Exports serialize the latest inputs before preview debounce');
    assert.equal(url.searchParams.get('header'),context.headerInput.value);
    if (action === 'markdown') assert.ok(snapshot.text.includes(url.href));
  }
  context.headerInput.value = '![icon src="http://example.com/bad.png"]';
  for (const handler of Object.values(handlers)) handler();
  assert.equal(snapshots.length,4,'Invalid custom syntax blocks every export');
  assert.ok(errors.at(-1) instanceof Error);
  context.headerInput.value = 'Valid again';
  editor.reset();
  assert.equal(container.children.length,0); assert.equal(editor.serialize(),''); assert.equal(addButton.disabled,false);
  handlers.url(); assert.equal(new URL(snapshots.at(-1).url).searchParams.has('images'),false);
  assert.match(html.slice(html.indexOf("    resetBtn.addEventListener('click'")), /imageLayers\.reset\(\)/, 'Main Reset clears image controls');
  // Exercise asynchronous preview gating and stale completion rejection.
  const loadingImages = [], timers = new Map();
  let timerId = 0;
  class PreviewImage { constructor() { loadingImages.push(this); } }
  Object.assign(context, {
    previewVersion:0,pendingPreview:null,customPreviewPending:false,confirmedPreviewUrl:'',debounceTimer:undefined,
    previewImg:{src:'previous'},markdownInput:{value:'previous'},customPreviewStatus:{hidden:true,textContent:''},designError:{hidden:true,textContent:''},
    exportButtons:[{},{},{},{}],Image:PreviewImage,updateBackgroundEffectControls(){},updateBackgroundControls(){},autoResizeTextarea(){},
    setTimeout: fn => { timers.set(++timerId,fn); return timerId; },clearTimeout:id => timers.delete(id),
  });
  runInContext(html.slice(html.indexOf('    function setDesignError('),html.indexOf('    function createEmojiExplosion(')),context);
  runInContext(html.slice(html.indexOf('    function hasCustomImages('),html.indexOf('    // Character counting')),context);
  const flush = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); };
  context.headerInput.value = '![icon src="https://example.com/a.png"] A';
  runInContext('update()',context);
  assert.ok(context.exportButtons.every(button => button.disabled));
  assert.equal(context.markdownInput.value,'');
  assert.throws(() => runInContext('requireReadyPreview(buildUrl())',context),/Wait/);
  flush(); const older = loadingImages.at(-1);
  context.headerInput.value = '![icon src="https://example.com/b.png"] B';
  runInContext('update()',context); flush(); const latest = loadingImages.at(-1);
  older.onload();
  assert.equal(context.previewImg.src,'previous','Late completion cannot display or authorize stale custom images');
  assert.ok(context.exportButtons.every(button => button.disabled));
  latest.onload();
  assert.ok(context.exportButtons.every(button => !button.disabled));
  assert.equal(new URL(context.previewImg.src,'https://example.com').searchParams.get('header'),context.headerInput.value);
  assert.doesNotThrow(() => runInContext('requireReadyPreview(buildUrl())',context));
  context.headerInput.value = '![icon src="https://example.com/unavailable.png"]';
  runInContext('update()',context); flush(); loadingImages.at(-1).onerror();
  assert.ok(context.exportButtons.every(button => button.disabled));
  assert.match(context.designError.textContent,/1 MiB/);
  assert.throws(() => runInContext('requireReadyPreview(buildUrl())',context),/successful preview/);
  context.headerInput.value = 'Plain banner';
  runInContext('update()',context); flush();
  assert.ok(context.exportButtons.every(button => !button.disabled),'Removing custom images restores the ordinary preview flow');
  console.log('PASS: custom image controls, geometry, rotation validation/export/reset, order, focus, removal, shared limits, fresh exports, validation, counters, reset and asynchronous preview gating');
} finally { globalThis.document = originalDocument; }
