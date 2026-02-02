import { Hono } from 'hono';
import { getRedis, isStatsEnabled } from '../config/redis.js';

const statsRoute = new Hono();

statsRoute.get('/stats', async (c) => {
  if (!isStatsEnabled()) {
    return c.json({
      enabled: false,
      message: 'Stats tracking is disabled',
    });
  }

  try {
    const redis = getRedis();
    if (!redis) {
      return c.json({
        enabled: false,
        message: 'Stats tracking is disabled',
      });
    }

    const repositories = await redis.smembers('repos:tracked');
    const totalRepositories = repositories.length;

    return c.json({
      enabled: true,
      totalRepositories,
      repositories: repositories.sort(),
      note: 'Only tracking public GitHub repositories using this service',
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json(
      {
        enabled: true,
        error: 'Failed to fetch stats',
        message: 'Redis connection issue',
      },
      500
    );
  }
});

export default statsRoute;
