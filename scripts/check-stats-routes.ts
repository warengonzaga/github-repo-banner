// Run with bun scripts/check-stats-routes.ts. Exercises inline usage stats with mocked Redis.
import assert from 'node:assert/strict';
import { mock } from 'bun:test';

const errors: unknown[][] = [];
mock.module('@wgtechlabs/log-engine', () => ({ LogEngine: { error: (...args: unknown[]) => errors.push(args) } }));
mock.module('../src/banner/svg-template.js', () => ({ buildBannerSVG: async () => '<svg/>' }));
let count: string | null = '2';
let failWrites = false;
let writes = 0;
const redis = {
  status: 'ready',
  multi() {
    const commands: string[] = [];
    const tx: Record<string, any> = {};
    for (const name of ['incr', 'expire']) {
      tx[name] = () => { commands.push(name); return tx; };
    }
    tx.exec = async () => {
      writes++;
      return failWrites ? [[new Error('READONLY secret payload'), null], [null, 1]] : commands.map(() => [null, 1]);
    };
    return tx;
  },
  get: async () => count,
};
let enabled = true;
mock.module('../src/config/redis.js', () => ({ getRedis: () => redis, isStatsEnabled: () => enabled }));
const { default: ui } = await import('../src/routes/ui.js');
const { default: banner } = await import('../src/routes/banner.js');

let response = await ui.request('/');
assert.equal(response.status, 200);
assert.match(response.headers.get('content-type') || '', /text\/html/);
assert.match(await response.text(), /Today: <strong>2<\/strong> banner renders/);
assert.equal(writes, 0, 'viewing stats does not change the count');
enabled = false;
assert.ok(!(await (await ui.request('/')).text()).includes('<h2>Usage stats</h2>'));
enabled = true;
redis.status = 'offline';
assert.match(await (await ui.request('/')).text(), /temporarily unavailable/i);
redis.status = 'ready';
count = 'not-a-number';
assert.match(await (await ui.request('/')).text(), /temporarily unavailable/i);
count = '2';

for (const [url, headers] of [['/render/banner?stats=false', {}], ['/render/banner', { DNT: '1' }], ['/render/banner', { 'Sec-GPC': '1' }]] as const) {
  assert.equal((await banner.request(url, { headers })).status, 200);
}
assert.equal(writes, 0);
assert.equal((await banner.request('/render/banner')).status, 200);
assert.equal((await banner.request('/banner')).status, 200, 'legacy banner URL remains supported');
assert.equal(writes, 2);
failWrites = true;
assert.equal((await banner.request('/render/banner')).status, 200, 'stats failure must not break banners');
assert.equal(errors.length, 1);
assert.ok(!JSON.stringify(errors).includes('secret'));
assert.match(await (await ui.request('/')).text(), /Today: <strong>2<\/strong> banner renders/);
console.log('PASS: inline HTML stats, opt-outs, canonical and legacy banner routes, best-effort counting');
