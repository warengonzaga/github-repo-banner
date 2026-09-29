import { LogEngine } from '@wgtechlabs/log-engine';
import { Redis } from 'ioredis';

let redisClient: Redis | null = null;
let statsEnabled = false;

/** Redis is required for search caching and quotas, independently of tracking. */
export async function initRedis(): Promise<void> {
  getPublicOrigin();
  getExportRetentionDays();
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
    statsEnabled = isOfficialInstance() || process.env.ENABLE_STATS === 'true';
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

/** Official hosting counts usage; self-hosted instances keep optional tracking. */
export function isOfficialInstance(): boolean {
  return process.env.OFFICIAL_HOSTED_INSTANCE === 'true';
}

/** Trust an explicit external origin, never arbitrary proxy headers. */
export function getPublicOrigin(): string | null {
  const configured =
    process.env.PUBLIC_ORIGIN ||
    (isOfficialInstance() ? 'https://ghrb.waren.build' : '');
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    )
      throw new Error();
    return url.origin;
  } catch {
    throw new Error(
      'PUBLIC_ORIGIN must be an http(s) origin without credentials, a path, query or fragment.',
    );
  }
}

/** Required on official hosting so saved-design retention is an explicit policy. */
export function getExportRetentionDays(): number | null {
  if (!isOfficialInstance()) return null;
  const value = process.env.EXPORT_RETENTION_DAYS || '';
  if (!/^[1-9]\d{0,2}$/.test(value) || Number(value) > 365) {
    throw new Error(
      'Official hosting requires EXPORT_RETENTION_DAYS between 1 and 365.',
    );
  }
  return Number(value);
}
