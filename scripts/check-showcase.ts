// TEST_REDIS_URL must point to an empty, disposable Redis database.
import assert from 'node:assert/strict';
import { mock } from 'bun:test';
import { parseBannerOptions } from '../src/banner/options.js';
// Deterministic image transport; real loader bounds are covered in check-image-loader.ts.
mock.module('../src/banner/image-loader.js', () => ({fetchImageAsBase64: async () => 'data:image/png;base64,iVBORw0KGgo='}));
import { randomBytes, randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { closeRedis, getRedis, initRedis, isStatsEnabled, getExportRetentionDays, getPublicOrigin } from '../src/config/redis.js';
import showcase, { SHOWCASE_KEY, SHOWCASE_POLICY, exportKey, EXPORT_INDEX_KEY, EXPORT_RATE_KEY, MAX_EXPORTS, EXPORTS_PER_MINUTE, NEW_EXPORT_WINDOW_MS } from '../src/routes/showcase.js';
import stats from '../src/routes/stats.js';
import ui from '../src/routes/ui.js';
import { usageKeys, usageOptedOut } from '../src/utils/usage-stats.js';

assert.ok(process.env.TEST_REDIS_URL, 'Use a disposable Redis database');
process.env.REDIS_URL = process.env.TEST_REDIS_URL;
process.env.ENABLE_STATS = 'false';
process.env.OFFICIAL_HOSTED_INSTANCE = 'true';
for (const value of ['', '0', '366', '30.5', '30days', '-1']) {
  process.env.EXPORT_RETENTION_DAYS = value;
  assert.throws(getExportRetentionDays, /EXPORT_RETENTION_DAYS/);
}
for (const value of ['1', '30', '365']) {
  process.env.EXPORT_RETENTION_DAYS = value;
  assert.equal(getExportRetentionDays(), Number(value));
}
for (const value of ['https://user:password@example.com', 'https://example.com/path', 'ftp://example.com', 'https://example.com?query=1']) {
  process.env.PUBLIC_ORIGIN = value;
  assert.throws(getPublicOrigin, /PUBLIC_ORIGIN/);
}
process.env.PUBLIC_ORIGIN = 'http://localhost';
process.env.EXPORT_RETENTION_DAYS = '30';
await initRedis();
let redis = getRedis()!;
const keys = usageKeys();
const app = new Hono().route('/', showcase).route('/', ui).route('/', stats);
const request = (path: string, body: unknown, method = 'POST', origin = 'http://localhost') => app.request(`http://localhost${path}`, {
  method, headers: { origin, 'Content-Type':'application/json', DNT:'1', 'Sec-GPC':'1' }, body: JSON.stringify(body),
});
const snapshot = async () => (await app.request('/stats')).json();
const submission = () => ({ action:'svg', showcase:true, id:`${Date.now()}-${randomUUID()}`, removalToken:randomBytes(32).toString('hex'), policyVersion:SHOWCASE_POLICY,
  query:{ header:'Community banner', bg:'123456-654321', bgbrightness:'80', support:'true' } });
let ownsKeys = false;
try {
  assert.equal(await redis.exists(SHOWCASE_KEY, EXPORT_INDEX_KEY, EXPORT_RATE_KEY, keys.counters, keys.repositories), 0, 'Existing data will not be touched');
  assert.equal((await redis.keys('exports:v1:*')).length,0,'Existing exports will not be touched');
  ownsKeys = true;
  assert.ok(isStatsEnabled(), 'Official mode overrides ENABLE_STATS=false');
  assert.equal(usageOptedOut('false','1','1'), false);
  const customQuery = {header:'![icon src="https://example.com/logo.png" w="48px"] Saved',subheader:'![icon src="https://example.com/sub.png" h="100%"] Details',images:JSON.stringify([{src:'https://example.com/layer.png',x:12,y:24,w:120,h:80,placement:'front'}])};
  const unshared = [];
  for (const action of ['markdown','url','svg','png']) {
    const entry = {...submission(),action,showcase:false,query:customQuery};
    unshared.push(entry);
    const response = await request('/exports?stats=false', entry);
    assert.equal(response.status,201);
    const result = await response.json();
    assert.equal(result.saved,true);
    assert.equal(result.showcased,false);
    assert.deepEqual(JSON.parse((await redis.get(exportKey(entry.id)))!).options,JSON.parse(JSON.stringify(parseBannerOptions(customQuery))),'All export actions preserve custom settings without publication');
    assert.ok(await redis.ttl(exportKey(entry.id)) > 29 * 86400);
    assert.equal((await app.request(`/showcase/${entry.id}.svg`)).status,404,'Unshared saved exports have no public preview');
  }
  assert.equal((await snapshot()).exports.total,4);
  assert.equal(await redis.exists(SHOWCASE_KEY),0,'Declined showcase saves the export without public publication');
  assert.ok(!(await (await app.request('/showcase')).text()).includes(unshared[0].id));
  const expiry = await redis.pttl(exportKey(unshared[0].id));
  assert.equal((await request('/exports',unshared[0])).status,200);
  assert.ok(await redis.pttl(exportKey(unshared[0].id)) <= expiry,'Retry does not extend retention');
  assert.equal((await snapshot()).exports.total,4);
  assert.equal((await request('/exports',{...unshared[0],showcase:true})).status,409,'Choice is immutable under retry ID');
  process.env.PUBLIC_ORIGIN = 'https://banner.example.com';
  const proxied = await app.request('http://banner.example.com/exports', {method:'POST',headers:{origin:'https://banner.example.com','Content-Type':'application/json'},body:JSON.stringify({...submission(),showcase:false})});
  assert.equal(proxied.status,201,'Configured HTTPS origin survives internal HTTP proxy hop');
  process.env.PUBLIC_ORIGIN = 'http://localhost';
  assert.equal((await request('/exports',{action:'svg',showcase:false})).status,400,'Official exports require design settings');
  assert.equal((await request('/exports',submission(),'POST','https://evil.example')).status,403);
  for (const body of [null, [], {}, {action:'bad',showcase:true}, {action:'svg',showcase:'true'}, {...submission(),policyVersion:'old'}]) {
    assert.equal((await request('/exports',body)).status,400);
  }
  assert.equal((await request('/exports',{...submission(),query:{header:'x'.repeat(13000)}})).status,413);
  const first = {...submission(),query:customQuery};
  const responses = await Promise.all(Array.from({length:8},()=>request('/exports',first)));
  assert.equal(responses.filter(response=>response.status===201).length,1,'Concurrent retries publish once');
  assert.equal(responses.filter(response=>response.status===200).length,7);
  assert.equal((await snapshot()).exports.total,6);
  assert.equal((await snapshot()).exports.showcased,1);
  assert.equal(await redis.hlen(SHOWCASE_KEY),1);
  assert.equal((await request('/exports',{...first,query:{header:'changed'}})).status,409);
  const stored = JSON.parse((await redis.hget(SHOWCASE_KEY,first.id))!);
  assert.ok(!JSON.stringify(stored).includes(first.removalToken),'Removal secrets are hashed');
  assert.deepEqual(stored.options,JSON.parse(JSON.stringify(parseBannerOptions(customQuery))));
  const customFeed = await (await app.request('/showcase')).json();
  assert.equal(customFeed.entries[0].label, 'custom icon Saved — custom icon Details');
  assert.ok(!JSON.stringify(customFeed).includes('example.com'));
  const beforePreview = await redis.hgetall(keys.counters);
  const preview = await app.request(`/showcase/${first.id}.svg`);
  assert.equal(preview.status,200);
  assert.equal(preview.headers.get('Cache-Control'),'no-store');
  assert.match(preview.headers.get('Content-Security-Policy')!,/sandbox/);
  const renderedCustom = await preview.text();
  assert.match(renderedCustom, /data:image\/png;base64/);
  assert.match(renderedCustom, /x="12" y="24" width="120" height="80"/);
  assert.ok(renderedCustom.indexOf('</foreignObject>') < renderedCustom.indexOf('x="12" y="24"'));
  assert.match(renderedCustom,/Saved/);
  assert.deepEqual(await redis.hgetall(keys.counters),beforePreview,'Gallery previews do not increment usage');
  const rejectedImage = {...submission(),query:{header:'safe',bgimg:'https://localhost/private.png'}};
  assert.equal((await request('/exports',rejectedImage)).status,201);
  assert.equal(JSON.parse((await redis.hget(SHOWCASE_KEY,rejectedImage.id))!).options.background.type,'gradient');
  for (let i=0;i<13;i++) assert.equal((await request('/exports',submission())).status,201);
  const page = await (await app.request('/showcase')).json();
  assert.equal(page.entries.length,12);
  assert.ok(page.nextCursor);
  assert.deepEqual(Object.keys(page.entries[0]).sort(),['createdAt','id','label','previewUrl']);
  assert.ok(!JSON.stringify(page).includes('options'));
  assert.ok(page.entries.every((entry:any)=>entry.label && !entry.label.includes('<')),'Feed includes sanitized visible-text descriptions');
  const rest = await (await app.request(`/showcase?before=${encodeURIComponent(page.nextCursor)}`)).json();
  assert.equal(rest.entries.length,3);
  assert.equal(rest.nextCursor,null);
  assert.equal(new Set([...page.entries,...rest.entries].map(entry=>entry.id)).size,15);
  assert.equal((await app.request('/showcase?before=bad')).status,400);
  assert.equal((await request(`/showcase/${first.id}`,{removalToken:'0'.repeat(64)},'DELETE')).status,403);
  assert.equal((await request(`/showcase/${first.id}`,{removalToken:first.removalToken},'DELETE')).status,200);
  assert.equal((await app.request(`/showcase/${first.id}.svg`)).status,404);
  assert.equal((await request(`/showcase/${first.id}`,{removalToken:first.removalToken},'DELETE')).status,200);
  assert.ok(!(await (await app.request('/showcase')).text()).includes(first.id));
  assert.ok(await redis.exists(exportKey(first.id)),'Withdrawal retains saved export until TTL');
  const withdrawnRetry = await (await request('/exports',first)).json();
  assert.equal(withdrawnRetry.showcased,false);
  assert.equal(withdrawnRetry.showcaseReason,'removed');
  const expired = {...first, id:`${Date.now()-NEW_EXPORT_WINDOW_MS-1000}-${randomUUID()}`};
  await redis.hset(SHOWCASE_KEY,expired.id,JSON.stringify({...stored,id:expired.id}));
  await redis.set(exportKey(expired.id),JSON.stringify({...stored,id:expired.id}));
  assert.equal((await request(`/showcase/${expired.id}`,{removalToken:expired.removalToken},'DELETE')).status,200);
  await redis.del(exportKey(expired.id));
  assert.equal((await request('/exports',expired)).status,409,'Expired ID prevents republishing without a permanent withdrawal marker');
  assert.equal((await app.request(`/showcase/${first.id}.svg`)).status,404,'Retry never republishes a withdrawn showcase');
  await redis.del(exportKey(rejectedImage.id));
  const countBefore = (await snapshot()).exports.total;
  assert.equal((await request('/exports',rejectedImage)).status,200,'Surviving public copy protects retries after export expiration');
  assert.equal((await snapshot()).exports.total,countBefore);
  const batch = redis.multi();
  for(let i=await redis.hlen(SHOWCASE_KEY);i<1000;i++) batch.hset(SHOWCASE_KEY,randomUUID(),JSON.stringify(stored));
  await batch.exec();
  const full = submission();
  const fullResponse = await request('/exports',full);
  assert.equal(fullResponse.status,201,'Full gallery still saves the export');
  const fullData = await fullResponse.json();
  assert.equal(fullData.showcased,false);
  assert.equal(fullData.showcaseReason,'full');
  assert.ok(await redis.exists(exportKey(full.id)));
  assert.equal((await app.request(`/showcase/${full.id}.svg`)).status,404);
  assert.equal((await app.request('/log',{method:'POST',body:'legacy'})).status,200,'Export middleware must not change legacy /log');
  assert.equal(await redis.exists('showcase:v1:withdrawn'),0,'No permanent withdrawal identifiers are allocated');
  assert.equal((await request('/exports',{...submission(),id:`${Date.now()+600000}-${randomUUID()}`})).status,409);
  assert.equal((await request('/exports',{...submission(),query:{header:'bad\ud800'}})).status,400,'Reject malformed Unicode at the input boundary');
  for (const query of [{header:'a'.repeat(49)+'😀'}, {header:'Test',subheader:'a'.repeat(59)+'😀'}]) {
    assert.equal((await request('/exports',{...submission(),showcase:false,query})).status,201,'Valid emoji near a limit remains serializable in Redis');
  }
  await redis.hdel(SHOWCASE_KEY,(await redis.hkeys(SHOWCASE_KEY)).find(id=>id.length===36)!);
  const delayed = submission();
  assert.equal((await request(`/showcase/${delayed.id}`,{removalToken:delayed.removalToken},'DELETE')).status,409,'Do not promise removal before a delayed submission arrives');
  assert.equal((await request('/exports',delayed)).status,201);
  assert.equal((await app.request(`/showcase/${delayed.id}.svg`)).status,200,'Delayed publication still requires a confirmed withdrawal');
  assert.equal((await request(`/showcase/${delayed.id}`,{removalToken:delayed.removalToken},'DELETE')).status,200);
  assert.equal((await app.request(`/showcase/${delayed.id}.svg`)).status,404);
  assert.equal((await (await request('/exports',delayed)).json()).showcased,false,'Confirmed withdrawal cannot be reversed by a delayed retry');
  const stale = {...submission(),id:`${Date.now()-NEW_EXPORT_WINDOW_MS-1000}-${randomUUID()}`};
  assert.equal((await request(`/showcase/${stale.id}`,{removalToken:stale.removalToken},'DELETE')).status,200);
  assert.equal((await request('/exports',stale)).status,409,'A confirmed absent expired ID cannot later publish');

  // Race for the last rate slot; existing retries do not consume quota or extend TTL.
  await redis.del(EXPORT_RATE_KEY);
  const rateSeed = redis.multi();
  for(let i=0;i<EXPORTS_PER_MINUTE-1;i++) rateSeed.zadd(EXPORT_RATE_KEY,Date.now(),`rate-${i}`);
  await rateSeed.exec();
  const rateAttempts = [{...submission(),showcase:false},{...submission(),showcase:false}];
  const rateResponses = await Promise.all(rateAttempts.map(entry=>request('/exports',entry)));
  assert.deepEqual(rateResponses.map(r=>r.status).sort(),[201,429]);
  assert.equal(await redis.zcard(EXPORT_RATE_KEY),EXPORTS_PER_MINUTE);
  assert.equal((await request('/exports',unshared[0])).status,200,'Retry passes even when admission rate is exhausted');
  const rejectedRate = rateAttempts[rateResponses.findIndex(r=>r.status===429)];
  assert.equal(await redis.exists(exportKey(rejectedRate.id)),0,'Rate rejection cannot leave a record');
  assert.equal(rateResponses.find(r=>r.status===429)!.headers.get('Retry-After'),'60');
  await redis.del(EXPORT_RATE_KEY);

  // Atomic retention cap, excluding expired reservations but never evicting retained exports.
  const originalIndex = await redis.zrange(EXPORT_INDEX_KEY,0,-1,'WITHSCORES');
  await redis.del(EXPORT_INDEX_KEY);
  const capacitySeed = redis.multi();
  for(let i=0;i<MAX_EXPORTS-1;i++) capacitySeed.zadd(EXPORT_INDEX_KEY,Date.now()+86400000,`capacity-${i}`);
  capacitySeed.zadd(EXPORT_INDEX_KEY,Date.now()-1,'expired-reservation');
  await capacitySeed.exec();
  const capAttempts = [{...submission(),showcase:false},{...submission(),showcase:false}];
  const capResponses = await Promise.all(capAttempts.map(entry=>request('/exports',entry)));
  assert.deepEqual(capResponses.map(r=>r.status).sort(),[201,429]);
  assert.equal(await redis.zcard(EXPORT_INDEX_KEY),MAX_EXPORTS,'Expired reservations reclaimed and cap never exceeded');
  assert.equal((await request('/exports',unshared[0])).status,200,'Existing retry works at retained capacity');
  const rejectedCap = capAttempts[capResponses.findIndex(r=>r.status===429)];
  assert.equal(await redis.exists(exportKey(rejectedCap.id)),0);
  assert.deepEqual(JSON.parse((await redis.get(exportKey(unshared[0].id)))!).options,JSON.parse(JSON.stringify(parseBannerOptions(customQuery))),'Capacity never evicts accepted designs');
  await redis.del(EXPORT_INDEX_KEY,EXPORT_RATE_KEY);
  for(let i=0;i<originalIndex.length;i+=2) await redis.zadd(EXPORT_INDEX_KEY,originalIndex[i+1],originalIndex[i]);
  const longLayers=JSON.stringify(Array.from({length:5},(_,i)=>({src:'https://example.com/'+String(i)+'a'.repeat(430)+'.png'})));
  assert.ok(longLayers.length>2048 && longLayers.length<4096);
  const longExport={...submission(),showcase:false,query:{images:longLayers}};
  assert.equal((await request('/exports',longExport)).status,201,'Full layer JSON survives the export boundary');
  assert.deepEqual(JSON.parse((await redis.get(exportKey(longExport.id)))!).options.images,parseBannerOptions(longExport.query).images);
  assert.equal((await request('/exports',{...submission(),query:{images:'['}})).status,400);
  const home = await (await app.request('/')).text();
  assert.ok(home.includes('data-official="true"'));
  assert.ok(home.includes('Exports are counted and their designs are saved for 30 days.'));
  assert.ok(home.includes('/export.js'));
  await redis.del(SHOWCASE_KEY,EXPORT_INDEX_KEY, EXPORT_RATE_KEY,keys.counters,keys.repositories, ...await redis.keys('exports:v1:*'));
  await closeRedis();
  process.env.OFFICIAL_HOSTED_INSTANCE = 'false';
  process.env.ENABLE_STATS = 'true';
  await initRedis(); redis = getRedis()!;
  assert.equal((await request('/exports',submission())).status,400);
  assert.deepEqual(await (await request('/exports',{action:'svg',showcase:false})).json(),{showcased:false,counted:false},'Selfhost DNT/GPC remains respected');
  assert.equal(await redis.exists(keys.counters),0);
  assert.equal((await (await app.request('/showcase')).json()).enabled,false);
  console.log('PASS: official export saving, bounded concurrent admission, Unicode limits, TTL/retry/counting, proxy origin, accessible feed, pending removal, expiry replay protection and self-host compatibility');
} finally {
  if (ownsKeys && redis.status === 'ready') await redis.del(SHOWCASE_KEY,EXPORT_INDEX_KEY, EXPORT_RATE_KEY,keys.counters,keys.repositories, ...await redis.keys('exports:v1:*'));
  await closeRedis();
}
