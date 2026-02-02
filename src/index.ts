import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import bannerRoute from './routes/banner.js';
import uiRoute from './routes/ui.js';
import statsRoute from './routes/stats.js';
import { initRedis, isStatsEnabled } from './config/redis.js';

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
  console.log(`Banner server running at http://localhost:${info.port}`);
});
