import { LogEngine } from '@wgtechlabs/log-engine';
import type { Redis } from 'ioredis';

const RETENTION_SECONDS = 7 * 24 * 60 * 60;

export function usageKey(date = new Date()): string {
  return `usage:v3:${date.toISOString().slice(0, 10)}:banner-renders`;
}

export function usageOptedOut(
  stats: string | undefined,
  dnt: string | undefined,
  gpc: string | undefined,
): boolean {
  return stats === 'false' || dnt === '1' || gpc === '1';
}

export async function recordBannerRequest(redis: Redis): Promise<void> {
  try {
    const key = usageKey();
    const results = await redis
      .multi()
      .incr(key)
      .expire(key, RETENTION_SECONDS)
      .exec();
    if (!results || results.some(([error]) => error)) throw new Error();
  } catch {
    // Stats are best effort and never block banner rendering.
    LogEngine.error('Banner usage could not be recorded.');
  }
}

export async function getBannerRequestCount(
  redis: Redis,
  date = new Date(),
): Promise<number> {
  return Number((await redis.get(usageKey(date))) || 0);
}
