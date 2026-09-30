#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
project="ghrb-check-$$"
# Disposable stack: never read local API keys or touch the normal Compose volume.
export PORT=0 ENABLE_STATS=false PEXELS_API_KEY=
compose() { docker compose --env-file /dev/null -f compose.yaml -p "$project" "$@"; }
trap 'compose down --volumes --remove-orphans' EXIT
trap 'exit 1' INT TERM

compose up --build --wait --wait-timeout 90
compose exec -T app node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

assert.equal(process.versions.node.split('.')[0], '22');
assert.notEqual(process.getuid(), 0);
assert.equal(existsSync('node_modules/tsup'), false);
assert.equal(existsSync('.env'), false);
assert.ok(JSON.parse(readFileSync('package.json', 'utf8')).version);
for (const file of ['index.html', 'image-url.js', 'inline-icons.js', 'image-settings.js', 'image-layers.js', 'image-layers.css', 'LICENSE', 'CODE_OF_CONDUCT.md', 'usage.html', 'usage.js', 'pages.css', 'docs/README.md', 'docs/docs/api.md', 'docs/docs/self-hosting.md']) {
  assert.ok(existsSync(`dist/ui/${file}`), `${file} must be bundled`);
}
const base = 'http://127.0.0.1:3000';
const get = (path) => fetch(base + path, { signal: AbortSignal.timeout(5000) });
const health = await get('/health');
assert.equal(health.status, 200);
const status = await health.json();
assert.equal(status.database.available, true);
assert.equal(status.stats.enabled, false);
const home = await get('/');
assert.equal(home.status, 200);
const html = await home.text();
assert.match(html, /MIT License/);
assert.match(html, /Our Pledge/);
assert.equal((await get('/image-url.js')).status, 200);
for (const path of ['/docs', '/usage', '/pages.css', '/usage.js', '/inline-icons.js', '/image-settings.js', '/image-layers.js', '/image-layers.css']) {
  assert.equal((await get(path)).status, 200, `${path} must work in the production image`);
}
const docs = await (await get('/docs')).text();
assert.ok(docs.includes('id="api"') && docs.includes('id="self-hosting"'));
assert.ok(docs.includes('REDIS_URL'));
const usage = await (await get('/usage')).text();
assert.ok(usage.includes('src="/usage.js"') && usage.includes('href="/stats"'));
const banner = await get('/banner?header=Docker');
assert.equal(banner.status, 200);
assert.match(await banner.text(), /<svg/);
assert.equal((await get('/api/pexels/search?query=nature')).status, 503);
JS

test "$(compose exec -T redis redis-cli --raw CONFIG GET maxmemory-policy | tail -n 1)" = noeviction
compose exec -T redis redis-cli SET docker-check persistent
app_id=$(compose ps -q app)
compose stop redis
compose exec -T app node --input-type=module <<'JS'
import assert from 'node:assert/strict';
const get = (path) => fetch(`http://127.0.0.1:3000${path}`, { signal: AbortSignal.timeout(5000) });
const health = await get('/health');
assert.equal(health.status, 503);
assert.equal((await health.json()).database.available, false);
assert.equal((await get('/banner?header=Still%20available')).status, 200);
JS

compose rm -f redis
compose up --no-recreate --wait --wait-timeout 90
test "$(compose ps -q app)" = "$app_id"
test "$(compose exec -T redis redis-cli --raw GET docker-check)" = persistent
compose exec -T app node --input-type=module <<'JS'
import assert from 'node:assert/strict';
const health = await fetch('http://127.0.0.1:3000/health', { signal: AbortSignal.timeout(5000) });
assert.equal(health.status, 200);
assert.equal((await health.json()).database.available, true);
JS
printf '%s\n' 'Docker checks passed: packaged runtime, required Redis, outage recovery, persistent storage.'
