import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { LogEngine, LogMode } from '@wgtechlabs/log-engine';
import bannerRoute from './routes/banner.js';
import uiRoute from './routes/ui.js';
import statsRoute from './routes/stats.js';
import { initRedis, isStatsEnabled } from './config/redis.js';

// Configure log-engine based on environment
const env = process.env.NODE_ENV || 'development';
LogEngine.configure({ 
  mode: env === 'production' ? LogMode.INFO : LogMode.DEBUG 
});

const app = new Hono();

// Health check endpoint for Railway
app.get('/health', (c) => {
  const health: {
    status: string;
    timestamp: string;
    stats: {
      enabled: boolean;
      endpoint?: string;
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    stats: {
      enabled: isStatsEnabled(),
    },
  };

  if (isStatsEnabled()) {
    health.stats.endpoint = '/stats';
  }

  return c.json(health);
});

app.route('/', uiRoute);
app.route('/', bannerRoute);
app.route('/', statsRoute);

const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Redis before starting server
await initRedis();

serve({ fetch: app.fetch, port }, (info) => {
  LogEngine.info('='.repeat(50));
  LogEngine.info('GitHub Repo Banner Service');
  LogEngine.info('📦 Version: 1.2.0');
  LogEngine.info('👤 Author: Waren Gonzaga');
  LogEngine.info('='.repeat(50));
  LogEngine.info(`🚀 Server: http://localhost:${info.port}`);
  LogEngine.info(`📊 Stats: ${isStatsEnabled() ? 'Enabled (/stats)' : 'Disabled'}`);
  LogEngine.info('='.repeat(50));
});
