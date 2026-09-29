import { createHash } from 'node:crypto';
import type Redis from 'ioredis';

const RETENTION_SECONDS = 7 * 24 * 60 * 60;
const NON_REPOSITORY_PATHS = new Set([
  'settings',
  'orgs',
  'users',
  'explore',
  'notifications',
  'issues',
  'pulls',
  'search',
  'marketplace',
  'topics',
  'collections',
  'sponsors',
  'login',
  'signup',
  'features',
  'enterprise',
  'organizations',
]);

export function repositoryFromReferer(referer: string): string | null {
  try {
    const url = new URL(referer);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
    if (url.username || url.password || url.port) return null;
    const [, owner, repo] = url.pathname.split('/');
    if (!owner || !repo || NON_REPOSITORY_PATHS.has(owner.toLowerCase()))
      return null;
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(owner)) return null;
    if (!/^[a-z\d_.-]{1,100}$/i.test(repo) || repo === '.' || repo === '..')
      return null;
    // A valid-looking Referer is an observation, not proof that a public repo exists.
    return `${owner}/${repo}`.toLowerCase();
  } catch {
    return null;
  }
}

export function usageOptedOut(
  stats: string | undefined,
  dnt: string | undefined,
  gpc: string | undefined,
): boolean {
  return stats === 'false' || dnt === '1' || gpc === '1';
}

export function usageKeys(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return {
    day,
    counters: `usage:v2:${day}:counters`,
    repositories: `usage:v2:${day}:repositories`,
  };
}

export async function recordBannerRequest(
  redis: Redis,
  referer: string,
): Promise<void> {
  const now = new Date();
  const keys = usageKeys(now);
  const repository = repositoryFromReferer(referer);
  const transaction = redis
    .multi()
    .hincrby(keys.counters, 'requests', 1)
    .hsetnx(keys.counters, 'startedAt', now.toISOString())
    .expire(keys.counters, RETENTION_SECONDS);
  if (repository) {
    // Hash before sending to Redis so command logs do not contain repository names.
    const digest = createHash('sha256').update(repository).digest('hex');
    transaction
      .hincrby(keys.counters, 'repositoryRequests', 1)
      .pfadd(keys.repositories, digest)
      .expire(keys.repositories, RETENTION_SECONDS);
  }
  const result = await transaction.exec();
  if (!result || result.some(([error]) => error))
    throw new Error('Usage recording failed');
}
