import { Hono } from 'hono';
import { getRedis, isStatsEnabled } from '../config/redis.js';
import { isUsageRecordingAvailable, usageKeys } from '../utils/usage-stats.js';

const statsRoute = new Hono();

statsRoute.get('/stats', async (c) => {
  c.header('Cache-Control', 'no-store');
  if (!isStatsEnabled()) {
    return c.json({
      schemaVersion: 2,
      enabled: false,
      message: 'Stats tracking is disabled',
    });
  }

  const redis = getRedis();
  if (!redis || redis.status !== 'ready') {
    return c.json(
      {
        schemaVersion: 2,
        enabled: true,
        available: false,
        error: 'Stats storage is unavailable',
      },
      503,
    );
  }

  if (!isUsageRecordingAvailable()) {
    return c.json(
      {
        schemaVersion: 2,
        enabled: true,
        available: false,
        error: 'Stats recording failed for this UTC day on this instance',
      },
      503,
    );
  }

  try {
    const keys = usageKeys();
    const snapshot = await redis
      .multi()
      .hgetall(keys.counters)
      .pfcount(keys.repositories)
      .exec();
    if (
      !snapshot ||
      snapshot.length !== 2 ||
      snapshot.some(([error]) => error)
    ) {
      throw new Error('Stats snapshot failed');
    }
    if (!isUsageRecordingAvailable()) throw new Error('Stats recording failed');
    const counts = snapshot[0][1] as Record<string, string>;
    const estimatedUniqueRepositories = snapshot[1][1];
    if (!counts || typeof counts !== 'object' || Array.isArray(counts)) {
      throw new Error('Invalid stats counters');
    }
    const recordedBannerRequests = Number(counts.requests || 0);
    const requestsWithRepositoryReferer = Number(
      counts.repositoryRequests || 0,
    );
    const pageViews = {
      generator: Number(counts['page:generator'] || 0),
      documentation: Number(counts['page:documentation'] || 0),
      usage: Number(counts['page:usage'] || 0),
    };
    const totalPageViews = Object.values(pageViews).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (
      !Number.isSafeInteger(recordedBannerRequests) ||
      recordedBannerRequests < 0 ||
      !Number.isSafeInteger(requestsWithRepositoryReferer) ||
      requestsWithRepositoryReferer < 0 ||
      typeof estimatedUniqueRepositories !== 'number' ||
      !Number.isSafeInteger(estimatedUniqueRepositories) ||
      estimatedUniqueRepositories < 0 ||
      ![...Object.values(pageViews), totalPageViews].every(
        (count) => Number.isSafeInteger(count) && count >= 0,
      )
    ) {
      throw new Error('Invalid stats snapshot');
    }
    return c.json({
      schemaVersion: 2,
      enabled: true,
      available: true,
      window: {
        day: keys.day,
        timezone: 'UTC',
        firstRecordedAt: counts.startedAt || null,
      },
      recordedBannerRequests,
      requestsWithRepositoryReferer,
      estimatedUniqueRepositories,
      repositoryRefererCoverage:
        recordedBannerRequests > 0
          ? requestsWithRepositoryReferer / recordedBannerRequests
          : null,
      pageViews: {
        ...pageViews,
        total: totalPageViews,
        firstRecordedAt: counts.pagesStartedAt || null,
      },
      coverage: 'partial',
      note: 'Recorded origin GET /banner responses and successful GET /, /docs, /usage page responses only, not unique visitors, users, installations, or total usage. Includes previews, refreshes, bots, and retries. Assets, stats polling, HEAD requests, caches, opt-outs, disabled periods, and failed writes are not counted. Referers may be missing or spoofed; repository existence and visibility are not verified. Unique repositories use HyperLogLog (about 0.81% standard error).',
      privacy: {
        retention: 'Daily aggregates expire seven days after their last write.',
        stored:
          'Daily banner and per-page counts and a cardinality sketch of hashed repository identifiers; no repository list, banner content, IP addresses, cookies, or user identifiers.',
        optOut:
          'Add stats=false to the banner or page URL, or send DNT: 1 or Sec-GPC: 1. The query opt-out applies to that request.',
      },
    });
  } catch {
    return c.json(
      {
        schemaVersion: 2,
        enabled: true,
        available: false,
        error: 'Stats could not be read',
      },
      503,
    );
  }
});

// Compatibility for older UIs: accept the call without reading or logging its body.
statsRoute.post('/log', (c) => c.json({ success: true, logged: false }));

export default statsRoute;
