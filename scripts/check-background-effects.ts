// Run with bun scripts/check-background-effects.ts. No external services required.
import assert from 'node:assert/strict';
import { parseBackgroundEffects, buildBackgroundFilter } from '../src/banner/background-effects.js';
import { buildBannerSVG } from '../src/banner/svg-template.js';
import route from '../src/routes/banner.js';
const neutral = { blur: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0 };
assert.deepEqual(parseBackgroundEffects({}), neutral);
for (const value of ['NaN', 'Infinity', '-1', '201', '<script>', '']) {
  assert.deepEqual(parseBackgroundEffects(Object.fromEntries(['bgblur','bgbrightness','bgcontrast','bgsaturation','bggrayscale'].map(k=>[k,value]))), neutral);
}
assert.deepEqual(parseBackgroundEffects({bgblur:'30',bgbrightness:'0',bgcontrast:'200',bgsaturation:'0',bggrayscale:'100'}),{blur:30,brightness:0,contrast:200,saturation:0,grayscale:100});
assert.equal(buildBackgroundFilter(neutral,true),'');
assert.match(buildBackgroundFilter({...neutral,saturation:200,grayscale:50},false),/values="2".*values="0.5"/);
assert.equal(buildBackgroundFilter({...neutral,blur:10},false),'');
assert.match(buildBackgroundFilter({...neutral,blur:10},true),/feGaussianBlur stdDeviation="10"/);
const options = {header:'Sharp',subheader:'Also sharp',background:{id:'solid',name:'Solid',type:'solid' as const,color:'#808080',defaultTextColor:'#fff'},textColor:'#fff',fontFamily:'sans-serif',showWatermark:true};
const legacy = await buildBannerSVG(options);
assert.equal(await buildBannerSVG({...options,backgroundEffects:neutral}),legacy,'neutral settings must preserve output');
const styled = await buildBannerSVG({...options,backgroundEffects:{...neutral,brightness:50,contrast:120,grayscale:100}});
assert.match(styled,/<g filter="url\(#background-effects\)"><rect[^>]+\/><\/g>\n<foreignObject/);
assert.match(styled,/feColorMatrix type="saturate" values="0"/);
assert.match(styled,/ghrb\.waren\.build/);
assert.ok(!styled.slice(styled.indexOf('<foreignObject')).includes('filter='),'foreground and watermark remain unfiltered');
assert.equal(await buildBannerSVG({...options,backgroundEffects:{...neutral,blur:15}}),legacy,'blur does not affect solid backgrounds');
const transparent={...options,background:{...options.background,type:'transparent' as const}};
assert.equal(await buildBannerSVG({...transparent,backgroundEffects:{...neutral,brightness:0}}),await buildBannerSVG(transparent));
const invalid=await route.request('/banner?header=Sharp&bgblur=999&bgbrightness=NaN&bgcontrast=-1&bggrayscale=%22%3E');
assert.equal(invalid.status,200);assert.ok(!(await invalid.text()).includes('background-effects'));
const response=await route.request('/banner?header=Sharp&bg=808080&bgbrightness=50&bggrayscale=100');
assert.match(await response.text(),/slope="0.5"/);
const rejected=await route.request('/banner?header=Sharp&bgimg=https://localhost/private.png&bgblur=30');
assert.ok(!(await rejected.text()).includes('feGaussianBlur'),'rejected images do not activate blur');
console.log('PASS: bounds, neutral output, background-only filters, transparency, blur applicability and API wiring');
