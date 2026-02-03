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
  let body: any;
  
  try {
    body = await c.req.json();
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const { action, url } = body;

  // Validate types
  if (typeof action !== 'string' || !action) {
    return c.json({ error: 'Action must be a non-empty string' }, 400);
  }

  if (url !== undefined && typeof url !== 'string') {
    return c.json({ error: 'URL must be a string' }, 400);
  }

  // Enforce max lengths
  if (action.length > 200) {
    return c.json({ error: 'Action exceeds maximum length of 200 characters' }, 400);
  }

  if (url && url.length > 2048) {
    return c.json({ error: 'URL exceeds maximum length of 2048 characters' }, 400);
  }

  // Sanitize by stripping CR/LF to prevent log injection
  const sanitizedAction = action.replace(/[\r\n]/g, '');
  const sanitizedUrl = url ? url.replace(/[\r\n]/g, '') : 'N/A';

  try {
    // Log user action to server console with sanitized values
    LogEngine.log(`📊 User Action: ${sanitizedAction} | URL: ${sanitizedUrl}`);
    
    return c.json({ success: true });
  } catch (error) {
    // Log internal error details separately
    LogEngine.error('Error logging user action:', error instanceof Error ? error.message : 'Unknown error');
    return c.json({ error: 'Failed to log action' }, 500);
  }
});

export default statsRoute;
