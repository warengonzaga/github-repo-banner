import { Hono } from 'hono';
import { getRedis, isStatsEnabled } from '../config/redis.js';
import { LogEngine } from '@wgtechlabs/log-engine';

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

statsRoute.post('/log', async (c) => {
  try {
    const body = await c.req.json();
    const { action, url } = body;
    
    if (!action) {
      return c.json({ error: 'Action is required' }, 400);
    }
    
    // Log user action to server console
    LogEngine.log(`📊 User Action: ${action} | URL: ${url || 'N/A'}`);
    
    return c.json({ success: true });
  } catch (error) {
    LogEngine.error('Error logging user action:', error instanceof Error ? error.message : 'Unknown error');
    return c.json({ error: 'Failed to log action' }, 500);
  }
});

export default statsRoute;
