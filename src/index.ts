import 'dotenv/config';
import { createRequire } from 'node:module';
import { serve } from '@hono/node-server';
import { LogEngine, LogMode } from '@wgtechlabs/log-engine';
import { Hono } from 'hono';
import { getRedis, initRedis, isStatsEnabled } from './config/redis.js';
import bannerRoute from './routes/banner.js';
import pexelsRoute from './routes/pexels.js';
import showcaseRoute from './routes/showcase.js';
import statsRoute from './routes/stats.js';
import uiRoute from './routes/ui.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

// Configure log-engine based on environment
const env = process.env.NODE_ENV || 'development';
LogEngine.configure({
  mode: env === 'production' ? LogMode.INFO : LogMode.DEBUG,
});

const app = new Hono();

// Health check endpoint for Railway
app.get('/health', async (c) => {
  c.header('Cache-Control', 'no-store');
  const redis = getRedis();
  const available =
    redis?.status === 'ready' &&
    (await redis.ping().then(
      () => true,
      () => false,
    ));
  return c.json(
    {
      status: available ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: { available },
      stats: {
        enabled: isStatsEnabled(),
        ...(isStatsEnabled() ? { endpoint: '/stats' } : {}),
      },
    },
    available ? 200 : 503,
  );
});

app.route('/', showcaseRoute);
app.route('/', uiRoute);
app.route('/', bannerRoute);
app.route('/', pexelsRoute);
app.route('/', statsRoute);

const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Redis before starting server
try {
  await initRedis();
} catch (error) {
  LogEngine.error(
    error instanceof Error ? error.message : 'Redis startup failed.',
  );
  process.exit(1);
}

serve({ fetch: app.fetch, port }, (info) => {
  LogEngine.info('='.repeat(50));
  LogEngine.info('GitHub Repo Banner Service');
  LogEngine.info(`📦 Version: ${version}`);
  LogEngine.info('👤 Author: Waren Gonzaga');
  LogEngine.info('='.repeat(50));
  LogEngine.info(`🚀 Server: http://localhost:${info.port}`);
  LogEngine.info(
    `📊 Stats: ${isStatsEnabled() ? 'Enabled (/stats)' : 'Disabled'}`,
  );
  LogEngine.info('='.repeat(50));
});
