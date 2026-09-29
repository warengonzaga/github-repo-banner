// TEST_REDIS_URL must point to an empty, disposable Redis database.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { closeRedis, getRedis, initRedis, isStatsEnabled, getExportRetentionDays, getPublicOrigin } from '../src/config/redis.js';
import showcase, { SHOWCASE_KEY, SHOWCASE_POLICY, exportKey, WITHDRAWN_KEY } from '../src/routes/showcase.js';
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
const submission = () => ({ action:'svg', showcase:true, id:randomUUID(), removalToken:randomBytes(32).toString('hex'), policyVersion:SHOWCASE_POLICY,
  query:{ header:'Community banner', bg:'123456-654321', bgbrightness:'80', support:'true' } });
let ownsKeys = false;
try {
  assert.equal(await redis.exists(SHOWCASE_KEY, WITHDRAWN_KEY, keys.counters, keys.repositories), 0, 'Existing data will not be touched');
  assert.equal((await redis.keys('exports:v1:*')).length,0,'Existing exports will not be touched');
  ownsKeys = true;
  assert.ok(isStatsEnabled(), 'Official mode overrides ENABLE_STATS=false');
  assert.equal(usageOptedOut('false','1','1'), false);
  const unshared = [];
  for (const action of ['markdown','url','svg','png']) {
    const entry = {...submission(),action,showcase:false,query:{header:'Saved, not showcased'}};
    unshared.push(entry);
    const response = await request('/exports?stats=false', entry);
    assert.equal(response.status,201);
    const result = await response.json();
    assert.equal(result.saved,true);
    assert.equal(result.showcased,false);
    assert.equal(JSON.parse((await redis.get(exportKey(entry.id)))!).options.header,'Saved, not showcased');
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
  const first = submission();
  const responses = await Promise.all(Array.from({length:8},()=>request('/exports',first)));
  assert.equal(responses.filter(response=>response.status===201).length,1,'Concurrent retries publish once');
  assert.equal(responses.filter(response=>response.status===200).length,7);
  assert.equal((await snapshot()).exports.total,6);
  assert.equal((await snapshot()).exports.showcased,1);
  assert.equal(await redis.hlen(SHOWCASE_KEY),1);
  assert.equal((await request('/exports',{...first,query:{header:'changed'}})).status,409);
  const stored = JSON.parse((await redis.hget(SHOWCASE_KEY,first.id))!);
  assert.ok(!JSON.stringify(stored).includes(first.removalToken),'Removal secrets are hashed');
  assert.equal(stored.options.header,'Community banner');
  assert.equal(stored.options.backgroundEffects.brightness,80);
  const beforePreview = await redis.hgetall(keys.counters);
  const preview = await app.request(`/showcase/${first.id}.svg`);
  assert.equal(preview.status,200);
  assert.equal(preview.headers.get('Cache-Control'),'no-store');
  assert.match(preview.headers.get('Content-Security-Policy')!,/sandbox/);
  assert.match(await preview.text(),/Community banner/);
  assert.deepEqual(await redis.hgetall(keys.counters),beforePreview,'Gallery previews do not increment usage');
  const rejectedImage = {...submission(),query:{header:'safe',bgimg:'https://localhost/private.png'}};
  assert.equal((await request('/exports',rejectedImage)).status,201);
  assert.equal(JSON.parse((await redis.hget(SHOWCASE_KEY,rejectedImage.id))!).options.background.type,'gradient');
  for (let i=0;i<13;i++) assert.equal((await request('/exports',submission())).status,201);
  const page = await (await app.request('/showcase')).json();
  assert.equal(page.entries.length,12);
  assert.ok(page.nextCursor);
  assert.deepEqual(Object.keys(page.entries[0]).sort(),['createdAt','id','previewUrl']);
  assert.ok(!JSON.stringify(page).includes('options'));
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
  await redis.del(exportKey(first.id));
  assert.equal((await request('/exports',first)).status,409,'Withdrawal ID prevents republishing even after saved export expiry');
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
  const home = await (await app.request('/')).text();
  assert.ok(home.includes('data-official="true"'));
  assert.ok(home.includes('Exports are counted and their designs are saved for 30 days.'));
  assert.ok(home.includes('/export.js'));
  await redis.del(SHOWCASE_KEY,WITHDRAWN_KEY,keys.counters,keys.repositories, ...await redis.keys('exports:v1:*'));
  await closeRedis();
  process.env.OFFICIAL_HOSTED_INSTANCE = 'false';
  process.env.ENABLE_STATS = 'true';
  await initRedis(); redis = getRedis()!;
  assert.equal((await request('/exports',submission())).status,400);
  assert.deepEqual(await (await request('/exports',{action:'svg',showcase:false})).json(),{showcased:false,counted:false},'Selfhost DNT/GPC remains respected');
  assert.equal(await redis.exists(keys.counters),0);
  assert.equal((await (await app.request('/showcase')).json()).enabled,false);
  console.log('PASS: all official exports saved with TTL, explicit showcasing, hidden unshared records, atomic retry/counting, proxy origin, pagination, withdrawal without republishing, full-gallery saves and self-host compatibility');
} finally {
  if (ownsKeys && redis.status === 'ready') await redis.del(SHOWCASE_KEY,WITHDRAWN_KEY,keys.counters,keys.repositories, ...await redis.keys('exports:v1:*'));
  await closeRedis();
}
