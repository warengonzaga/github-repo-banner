// TEST_REDIS_URL=redis://127.0.0.1:6379 bun scripts/check-redis-connection.ts
import assert from 'node:assert/strict';
import net, { type Socket } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { closeRedis, getRedis, initRedis } from '../src/config/redis.js';

assert.ok(process.env.TEST_REDIS_URL, 'Set TEST_REDIS_URL to a disposable local Redis');
const target = new URL(process.env.TEST_REDIS_URL);
assert.equal(target.protocol, 'redis:');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname));
const sockets = new Set<Socket>();
const track = (socket: Socket) => {
  sockets.add(socket);
  socket.on('error', () => {});
  socket.on('close', () => sockets.delete(socket));
  return socket;
};
const listen = async (server: net.Server) => {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as net.AddressInfo).port;
};
let stall = false;
let connections = 0;
const proxy = net.createServer((socket) => {
  connections++;
  track(socket);
  const upstream = track(net.connect(Number(target.port || 6379), target.hostname.replace(/^\[|\]$/g, '')));
  socket.pipe(upstream);
  upstream.on('data', (data) => { if (!stall) socket.write(data); });
  socket.on('close', () => upstream.destroy());
  upstream.on('close', () => socket.destroy());
});
let handshake = Buffer.alloc(0);
const tlsProbe = net.createServer((socket) => {
  track(socket).once('data', (data) => {
    handshake = Buffer.concat([handshake, data]);
    socket.destroy();
  });
});

try {
  const proxyUrl = new URL(target);
  proxyUrl.hostname = '127.0.0.1';
  proxyUrl.port = String(await listen(proxy));
  process.env.REDIS_URL = proxyUrl.href;
  process.env.ENABLE_STATS = 'false';
  await initRedis();
  const client = getRedis()!;
  let disconnected = false;
  client.once('close', () => { disconnected = true; stall = false; });
  stall = true;
  const started = Date.now();
  await Promise.all(Array.from({ length: 8 }, () => assert.rejects(client.ping(), /Command timed out/)));
  for (let attempt = 0; attempt < 120 && !(disconnected && client.status === 'ready'); attempt++) await delay(50);
  assert.ok(disconnected, 'stalled replies must close the socket');
  assert.equal(client.status, 'ready', 'client must reconnect without an app restart');
  assert.ok(Date.now() - started < 8_000, 'recovery must be bounded');
  assert.ok(connections >= 2);
  assert.equal(await client.ping(), 'PONG', 'new commands work after recovery');
  await closeRedis();

  const port = await listen(tlsProbe);
  const secret = 'fixture-redis-secret';
  process.env.REDIS_URL = `REDISS://:${secret}@127.0.0.1:${port}`;
  await assert.rejects(initRedis(), (error: Error) => {
    assert.match(error.message, /^Redis is unavailable\./);
    assert.ok(!error.message.includes(secret));
    return true;
  });
  assert.ok(handshake.length > 2);
  assert.deepEqual(handshake.subarray(0, 2), Buffer.from([0x16, 0x03]), 'uppercase REDISS must initiate TLS');
  assert.ok(!handshake.includes(Buffer.from(secret)), 'credentials must not cross the connection in plaintext');
  assert.equal(getRedis(), null);
  process.env.REDIS_URL = `redis://:${secret}%@127.0.0.1:${port}`;
  await assert.rejects(initRedis(), { message: 'Redis is unavailable. Check REDIS_URL and start Redis before the app.' });
  console.log('PASS: bounded stalled-connection recovery, uppercase REDISS uses TLS, startup errors redact credentials');
} finally {
  await closeRedis();
  for (const socket of sockets) socket.destroy();
  await Promise.all([proxy, tlsProbe].map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
}
