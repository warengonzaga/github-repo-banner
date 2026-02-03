import Redis from 'ioredis';
import { LogEngine } from '@wgtechlabs/log-engine';

let redisClient: Redis | null = null;
let statsEnabled = false;

/**
 * Initialize Redis connection if stats tracking is enabled
 * @returns Promise<void>
 */
export async function initRedis(): Promise<void> {
  const enableStats = process.env.ENABLE_STATS === 'true';
  const redisUrl = process.env.REDIS_URL;

  if (!enableStats) {
    LogEngine.info('Stats tracking: DISABLED (privacy-first default)');
    statsEnabled = false;
    return;
  }

  if (!redisUrl) {
    LogEngine.warn('Stats tracking enabled but REDIS_URL not configured. Stats will be disabled.');
    statsEnabled = false;
    return;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          LogEngine.error('Redis connection failed after 3 retries. Stats tracking disabled.');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
      reconnectOnError(err) {
        LogEngine.error('Redis connection error:', err.message);
        return false; // Don't reconnect on error
      },
    });

    // Test connection
    await redisClient.ping();
    statsEnabled = true;
    LogEngine.info('Stats tracking: ENABLED');
  } catch (error) {
    LogEngine.error('Redis connection failed:', error instanceof Error ? error.message : 'Unknown error');
    LogEngine.info('Stats tracking: DISABLED');
    statsEnabled = false;
    if (redisClient) {
      await redisClient.quit().catch(() => {});
    }
    redisClient = null;
  }
}

/**
 * Get Redis client instance
 * @returns Redis client or null if not initialized
 */
export function getRedis(): Redis | null {
  return redisClient;
}

/**
 * Check if stats tracking is enabled and Redis is connected
 * @returns boolean
 */
export function isStatsEnabled(): boolean {
  return statsEnabled && redisClient !== null;
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => {});
    redisClient = null;
    statsEnabled = false;
  }
}
