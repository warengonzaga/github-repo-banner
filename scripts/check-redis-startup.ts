// Run after bun run build. Exercises the production entry point, never a real service.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import type { Socket } from 'node:net';

async function fails(redisUrl: string, expected: RegExp) {
  const child = spawn('node', ['dist/index.js'], {
    env: { ...process.env, REDIS_URL: redisUrl, ENABLE_STATS: 'false', PORT: '0', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  const timeout = setTimeout(() => child.kill('SIGKILL'), 9_000);
  try {
    const code = await new Promise<number | null>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', resolve);
    });
    assert.equal(code, 1, 'startup must exit without hanging or serving');
    assert.match(output, expected);
    assert.doesNotMatch(output, /fixture-secret|Server: http/);
  } finally {
    clearTimeout(timeout);
    child.kill();
  }
}
await fails('', /REDIS_URL is required/);
await fails('https://user:fixture-secret@localhost', /REDIS_URL is required/);
await fails('redis://:fixture-secret@127.0.0.1:1', /Redis is unavailable/);
const sockets = new Set<Socket>();
const blackhole = createServer((socket) => { sockets.add(socket); socket.on('error', () => {}); });
await new Promise<void>((resolve) => blackhole.listen(0, '127.0.0.1', resolve));
try {
  const address = blackhole.address();
  assert.ok(address && typeof address !== 'string');
  await fails(`redis://:fixture-secret@127.0.0.1:${address.port}`, /Redis is unavailable/);
} finally {
  for (const socket of sockets) socket.destroy();
  blackhole.close();
}
console.log('PASS: missing/invalid/unreachable/unresponsive Redis fails startup; no credentials or listener');
