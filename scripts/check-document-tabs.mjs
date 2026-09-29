// Run with node scripts/check-document-tabs.mjs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const html = readFileSync(new URL('../src/ui/index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf('    function selectDocumentTab('), html.indexOf('    documentTabs.forEach((tab, index)'));
const panels = { readme: {}, conduct: {}, license: {} };
const tabs = Object.keys(panels).map(id => ({
  getAttribute: () => id, setAttribute(key, value) { this[key] = value; },
  classList: { toggle() {} },
}));
const context = { documentTabs: tabs, document: { getElementById: id => panels[id] } };
for (const selected of tabs) {
  runInNewContext(source + '; selectDocumentTab(documentTabs[' + tabs.indexOf(selected) + '])', context);
  for (const tab of tabs) {
    assert.equal(tab['aria-selected'], String(tab === selected));
    assert.equal(panels[tab.getAttribute()].hidden, tab !== selected);
    assert.equal(tab.tabIndex, tab === selected ? 0 : -1);
  }
}
