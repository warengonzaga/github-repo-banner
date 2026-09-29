// Run with bun scripts/check-stats-routes.ts. Exercises routes with mocked Redis.
import assert from 'node:assert/strict';
import { mock } from 'bun:test';

const errors: unknown[][] = [];
mock.module('@wgtechlabs/log-engine', () => ({ LogEngine: { error: (...args: unknown[]) => errors.push(args) } }));
mock.module('../src/banner/svg-template.js', () => ({ buildBannerSVG: async () => '<svg/>' }));
let snapshot: unknown = [[null, { requests: '2', repositoryRequests: '1' }], [null, 1]];
let failWrites = false;
let writes = 0;
const reads: string[][] = [];
const redis = {
  status: 'ready',
  multi() {
    const commands: string[] = [];
    const tx: Record<string, any> = {};
    for (const name of ['hincrby', 'hsetnx', 'expire', 'pfadd', 'hgetall', 'pfcount']) {
      tx[name] = () => { commands.push(name); return tx; };
    }
    tx.exec = async () => {
      if (commands.includes('hgetall')) { reads.push(commands); return snapshot; }
      writes++;
      if (failWrites) {
        const error = new Error('READONLY secret request payload');
        if (process.argv.includes('--command-error')) return [[error, null]];
        throw error;
      }
      return commands.map(() => [null, 1]);
    };
    return tx;
  },
};
mock.module('../src/config/redis.js', () => ({ getRedis: () => redis, isStatsEnabled: () => true }));
const { default: stats } = await import('../src/routes/stats.js');
const { default: banner } = await import('../src/routes/banner.js');
let response = await stats.request('/stats');
assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.repositoryRefererCoverage, 0.5);
assert.equal(body.estimatedUniqueRepositories, 1);
assert.deepEqual(reads, [['hgetall', 'pfcount']], 'one transaction must contain both reads');
for (const invalid of [null, [[null, {}]], [[new Error('WRONGTYPE'), null], [null, 1]], [[null, {}], [new Error('WRONGTYPE'), null]], [[null, null], [null, 1]], [[null, {requests: 'bad'}], [null, 1]], [[null, {}], [null, 'bad']]]) {
  snapshot = invalid;
  assert.equal((await stats.request('/stats')).status, 503);
}
snapshot = [[null, {}], [null, 0]];
assert.equal((await stats.request('/stats')).status, 200);
for (const [url, headers] of [['/banner?stats=false', {}], ['/banner', { DNT: '1' }], ['/banner', { 'Sec-GPC': '1' }]] as const) {
  assert.equal((await banner.request(url, {headers})).status, 200);
}
assert.equal(writes, 0);
assert.equal((await banner.request('/banner')).status, 200);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(writes, 1);
failWrites = true;
assert.equal((await banner.request('/banner')).status, 200, 'stats failure must not break banners');
await new Promise(resolve => setTimeout(resolve, 0));
response = await stats.request('/stats');
assert.equal(response.status, 503);
assert.equal((await response.json()).available, false);
assert.equal(errors.length, 1);
assert.ok(!JSON.stringify(errors).includes('secret'));
await banner.request('/banner');
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(errors.length, 1, 'persistent failures must not flood logs');
failWrites = false;
await banner.request('/banner');
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal((await stats.request('/stats')).status, 503, 'later success does not recover lost observations');
console.log('PASS: transactional reads, invalid results, opt-outs, payload-free write failure and degraded health');
