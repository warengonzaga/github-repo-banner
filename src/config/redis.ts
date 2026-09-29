import { LogEngine } from '@wgtechlabs/log-engine';
import Redis from 'ioredis';

let redisClient: Redis | null = null;
let statsEnabled = false;

/** Redis is required for search caching and quotas, independently of tracking. */
export async function initRedis(): Promise<void> {
  let redisUrl: URL;
  try {
    redisUrl = new URL(process.env.REDIS_URL || '');
    if (!['redis:', 'rediss:'].includes(redisUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error(
      'REDIS_URL is required and must be a redis:// or rediss:// URL.',
    );
  }

  let client: Redis | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    client = new Redis(redisUrl.href, {
      lazyConnect: true,
      connectTimeout: 3_000,
      commandTimeout: 2_000,
      socketTimeout: 3_000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2_000),
    });
    // Raw connection errors can contain credentials. Health exposes availability.
    client.on('error', () => {});
    await Promise.race([
      client.connect().then(() => client?.ping()),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error()), 5_000);
      }),
    ]);
    redisClient = client;
    statsEnabled = process.env.ENABLE_STATS === 'true';
    LogEngine.info(
      `Redis connected. Stats tracking: ${statsEnabled ? 'ENABLED' : 'DISABLED'}`,
    );
  } catch {
    client?.disconnect();
    throw new Error(
      'Redis is unavailable. Check REDIS_URL and start Redis before the app.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function getRedis(): Redis | null {
  return redisClient;
}

/** Configuration stays enabled during outages; /stats reports unavailability. */
export function isStatsEnabled(): boolean {
  return statsEnabled;
}

export async function closeRedis(): Promise<void> {
  redisClient?.disconnect();
  redisClient = null;
  statsEnabled = false;
}
