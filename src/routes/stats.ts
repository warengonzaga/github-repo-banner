import { Hono } from 'hono';
import { getRedis, isStatsEnabled } from '../config/redis.js';
import { renderPage } from '../ui/pages.js';
import { getBannerRequestCount } from '../utils/usage-stats.js';

const statsRoute = new Hono();

function statsPage(content: string): string {
  return renderPage(
    'stats',
    `<div class="page-heading"><h1>Usage stats</h1></div>${content}`,
  );
}

statsRoute.get('/stats', async (c) => {
  c.header('Cache-Control', 'no-store');
  if (!isStatsEnabled()) {
    return c.html(
      statsPage('<p>Usage tracking is disabled on this instance.</p>'),
    );
  }

  const redis = getRedis();
  if (!redis || redis.status !== 'ready') {
    return c.html(
      statsPage('<p>Usage stats are temporarily unavailable.</p>'),
      503,
    );
  }

  try {
    const count = await getBannerRequestCount(redis);
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error();
    }
    const day = new Date().toISOString().slice(0, 10);
    return c.html(
      statsPage(
        `<section class="usage-report"><h2>Banner render requests today</h2><p class="usage-total">${count.toLocaleString()}</p><p class="muted">${day} UTC</p><p>Counts successful banner renders that reached this server. It is not a count of people or unique views; cached requests, previews, bots, and retries affect the total.</p></section>`,
      ),
    );
  } catch {
    return c.html(
      statsPage('<p>Usage stats are temporarily unavailable.</p>'),
      503,
    );
  }
});

export default statsRoute;
