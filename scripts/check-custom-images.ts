import assert from 'node:assert/strict';
import { mock } from 'bun:test';
import { parseCustomIcon, validateCustomIcons, sanitizeBannerText, describeBannerText, iconPixels } from '../src/ui/inline-icons.js';
import { parseImageLayers } from '../src/ui/image-settings.js';
import { parseBannerOptions } from '../src/banner/options.js';
import { parseHeaderWithIcons } from '../src/banner/icons.js';

const src='https://example.com/logo.png';
const token=`![icon src="${src}" w="48px"]`;
assert.deepEqual(parseCustomIcon(token),{src,w:'48px'});
assert.equal(iconPixels('150%',40),60);
assert.equal(iconPixels('48px',40),48);
for(const bad of [
 `![icon src="http://example.com/a.png"]`, `![icon src="https://localhost/a.png"]`,
 `![icon src="${src}" src="${src}"]`, `![icon src="${src}" onload="run"]`,
 `![icon src="${src}" w="0px"]`, `![icon src="${src}" w="201%"]`,
 `![icon src="${src}" h="NaNpx"]`, `![icon src="${src}" w=""]`,
 `![icon src="${src}"]![icon src="unfinished`, `![icon\tsrc="incomplete`,
]) assert.throws(()=>validateCustomIcons(bad),bad);
assert.equal(sanitizeBannerText(token+'a'.repeat(51)),token+'a'.repeat(50));
const bracketUrlToken='![icon src="https://example.com/logo](v1.png"]';
assert.equal(sanitizeBannerText(bracketUrlToken+' '+'a'.repeat(51)),bracketUrlToken+' '+'a'.repeat(49),'Truncation must not interpret brackets inside a complete custom image URL');
assert.equal(sanitizeBannerText(token+'a'.repeat(48)+'![github](dark'),token+'a'.repeat(48),'An unfinished brand theme after a custom token is still removed');
assert.equal(sanitizeBannerText(token+'a'.repeat(48)+'![unfinished'),token+'a'.repeat(48),'An unfinished icon after a custom token is still removed');
assert.equal(sanitizeBannerText('![github] '+token+' Text'),'![github] '+token+' Text');
assert.equal(describeBannerText(token+' Hello ![github]'),'custom icon Hello github icon');
assert.deepEqual(parseHeaderWithIcons('![github] '+token).map(s=>s.type),['icon','text','custom-icon']);
assert.deepEqual(parseImageLayers(undefined),[]);
const layer=parseImageLayers(JSON.stringify([{src}]))[0];
assert.deepEqual(layer,{src,x:0,y:0,w:128,h:128,fit:'contain',placement:'behind'});
for(const patch of [{x:-1},{y:305},{w:0},{h:305},{x:'2'},{x:null},{fit:'fill'},{placement:'above'},{src:'data:image/png;base64,foo'},{extra:1}]) {
  assert.throws(()=>parseImageLayers(JSON.stringify([{...layer,...patch}])));
}
assert.throws(()=>parseImageLayers('{}'));
assert.deepEqual(parseImageLayers(JSON.stringify([{src,rotation:0}]))[0],layer,'Zero rotation preserves the legacy normalized record');
for(const rotation of [30,90,180,270,360,22.5]) assert.equal(parseImageLayers(JSON.stringify([{src,rotation}]))[0].rotation,rotation);
for(const rotation of [-1,361,'90',null,true,{},[],NaN,Infinity]) assert.throws(()=>parseImageLayers(JSON.stringify([{src,rotation}])));
assert.throws(()=>parseImageLayers('[{"src":"https://example.com/logo.png","rotation":1e400}]'),'Non-finite JSON numbers are rejected');
assert.throws(()=>parseBannerOptions({header: '![ic<b></b>on src="http://127.0.0.1/"]'}));
assert.throws(()=>parseBannerOptions({header: '![ic<b></b>on src="https://example.com/a.png"]', images:JSON.stringify(Array(5).fill(layer))}));
assert.throws(()=>parseImageLayers('['));
assert.throws(()=>parseImageLayers(JSON.stringify(Array(6).fill(layer))));
assert.throws(()=>parseBannerOptions({header:token,images:JSON.stringify(Array(5).fill(layer))}));
const query={header:token+' Hello',subheader:`![icon src="${src}" h="150%"]`,images:JSON.stringify([{...layer,x:12,y:18,rotation:30}, {...layer,src:'https://example.com/front.png',placement:'front',fit:'stretch',rotation:270}]),support:'true'};
const options=parseBannerOptions(query);
assert.deepEqual(parseBannerOptions(Object.fromEntries(new URLSearchParams(query))),options,'Query round trip preserves options');
assert.equal(parseBannerOptions({header:'Legacy'}).images,undefined,'Old saved records remain compatible');

// Isolated transport fixture. Protected image-loader checks run separately; this proves layout/embedding.
const requested:string[]=[];
mock.module('../src/banner/image-loader.js',()=>({fetchImageAsBase64:async(url:string,max?:number)=>{
 assert.equal(max,1024*1024);requested.push(url);return url.includes('missing')?null:`data:image/png;base64,${Buffer.from(url).toString('base64')}`;
}}));
const {buildBannerSVG}=await import('../src/banner/svg-template.js');
const svg=await buildBannerSVG(options);
assert.equal(requested.length,2,'Repeated icons/layers share one protected download per URL');
assert.match(svg,/width:48px;height:auto/);
assert.match(svg,/width:auto;height:[\d.]+px/);
assert.match(svg,/x="12" y="18" width="128" height="128" preserveAspectRatio="xMidYMid meet"/);
assert.match(svg,/preserveAspectRatio="none" transform="rotate\(270 64 64\)"/);
assert.match(svg,/transform="rotate\(30 76 82\)"/);
const behind=svg.indexOf('x="12" y="18"'), text=svg.indexOf('<foreignObject'), front=svg.indexOf('preserveAspectRatio="none"'), watermark=svg.lastIndexOf('ghrb.waren.build');
assert.ok(behind<text && text<front && front<watermark,'Layers surround text and stay below the watermark');
assert.match(svg,/overflow="hidden"/);
assert.ok(!svg.includes(src),'All external images embedded; no browser-side image fetch');
await assert.rejects(() => buildBannerSVG(parseBannerOptions({header:`![icon src="https://example.com/missing.png"]`,images:JSON.stringify([{src:'https://example.com/missing.png'}])})), /custom image is unavailable/);
const five=Array.from({length:5},(_,i)=>({...layer,src:`https://example.com/${i}.png`}));
requested.length=0;
const fiveSVG=await buildBannerSVG(parseBannerOptions({header:'Five images',images:JSON.stringify(five)}));
assert.equal(requested.length,5);assert.equal((fiveSVG.match(/<image href=/g)||[]).length,5,'Fifth image survives bounded loading batches');
const wideToken=`![icon src="${src}" w="304px" h="1px"]`;
const tight=await buildBannerSVG(parseBannerOptions({header:wideToken.repeat(2)+'W'.repeat(50),subheader:wideToken.repeat(3)+'b'.repeat(60)}));
const fontSizes=[...tight.matchAll(/font-size:([\d.]+)px;font-weight:/g)].map(match=>Number(match[1]));
assert.ok(fontSizes[1]<=Math.round(fontSizes[0]*.4),'Fitting never enlarges a small subheader to the header size');
const defaultIcons=await buildBannerSVG(parseBannerOptions({header:`![icon src="${src}"]`.repeat(5)}));
assert.match(defaultIcons,/font-size:192px;font-weight:700/,'Default text-sized icons do not reserve a fixed 304px each');
const legacyOptions=parseBannerOptions({header:'Legacy',images:JSON.stringify([layer])});
const legacySVG=await buildBannerSVG(legacyOptions);
assert.ok(!legacySVG.includes('transform="rotate('));
assert.equal(await buildBannerSVG(parseBannerOptions({header:'Legacy',images:JSON.stringify([{...layer,rotation:0}])})),legacySVG,'Zero angle keeps legacy rendering identical');
const {default:bannerRoute}=await import('../src/routes/banner.js');
const invalidRotation=await bannerRoute.request('/banner?'+new URLSearchParams({images:JSON.stringify([{src,rotation:361}])}));
assert.equal(invalidRotation.status,400);
assert.match((await invalidRotation.json()).error,/rotation/);
console.log('PASS: custom icon parsing, safe URLs, sizing, limits, layer order, rotation/legacy compatibility, embedding/failure, five-image batching and query round trip');
