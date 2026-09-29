// Run with node scripts/check-pexels.mjs. No live Pexels key required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
const html = readFileSync(new URL('../src/ui/index.html', import.meta.url), 'utf8');
const source = html.slice(html.indexOf("    const pexelsMoreBtn ="), html.indexOf("    pexelsSearchBtn.addEventListener"));
function setup() {
  const element = () => ({ style: {}, textContent: '', disabled: false, children: [],
    setAttribute(name,value) { this[name]=value; }, set innerHTML(value) { this.children = []; }, appendChild(child) { this.children.push(child); }, addEventListener() {},
  });
  const more = element();
  const c = createContext({
    pexelsQuery: { value: 'mountains' }, pexelsSearchBtn: element(),
    pexelsResults: element(), pexelsAttribution: element(), pexelsClearBtn: element(),
    pexelsStatus: element(), AbortSignal, bgImgInput: {}, update() {},
    document: { getElementById: () => more, createElement: element },
  });
  runInContext(source, c);
  return { c, more, run: code => runInContext(code, c) };
}
const response = (count, hasMore) => ({ok: true, json: async () => ({photos: Array.from({length:count}, (_,id)=>({id,thumb:'photo.svg',url:'https://example.com/photo.jpg',photographer:'Test'})), hasMore})});
for (const [res, message] of [[{status:503}, /unavailable on this site right now/], [{status:502}, /unavailable right now/], [response(0,false), /No images found/], [null,/unavailable right now/]]) {
  const {c,run}=setup();c.fetch=async()=>{if(!res)throw Error('offline');return res;};
  await run('searchPexels()');assert.match(c.pexelsStatus.textContent,message);assert.equal(c.pexelsSearchBtn.disabled,false);
}
const {c,more,run}=setup();const urls=[];let res=response(9,true);
c.fetch=async url=>{urls.push(url);if(!res)throw Error('offline');return res;};
await run('searchPexels()');assert.equal(c.pexelsResults.children.length,9);assert.equal(more.hidden,false);
c.pexelsQuery.value='ocean';res=null;await run('searchPexels(true)');
assert.equal(c.pexelsResults.children.length,9);assert.equal(more.hidden,false);assert.match(c.pexelsStatus.textContent,/results are saved/);
res=response(9,true);await run('searchPexels(true)');assert.equal(c.pexelsResults.children.length,18);
assert.ok(urls.slice(1).every(url=>url.includes('q=mountains&page=2')), 'retry and edited input must retain original query/page');
res=response(2,false);await run('searchPexels(true)');assert.equal(c.pexelsResults.children.length,20);assert.equal(more.hidden,true);
const before=urls.length;await run('searchPexels(true)');assert.equal(urls.length,before);
res=response(9,true);await run('searchPexels()');assert.equal(c.pexelsResults.children.length,9);assert.match(urls.at(-1),/q=ocean&page=1/);
res=response(0,true);await run('searchPexels(true)');assert.equal(more.hidden,true);assert.equal(c.pexelsResults.children.length,9);assert.match(c.pexelsStatus.textContent,/No more images/);
let finish;c.fetch=()=>new Promise(resolve=>{finish=resolve;});const pending=run('searchPexels()');
assert.equal(c.pexelsSearchBtn.disabled,true);const oldFinish=finish;await run('searchPexels()');assert.equal(finish,oldFinish,'duplicate requests blocked');
run('clearPexelsResults()');finish(response(9,true));await pending;assert.equal(c.pexelsResults.children.length,0);assert.equal(more.hidden,true);
console.log('PASS: pagination, retry, exhaustion, query reset, duplicate clicks and stale-response clearing');
