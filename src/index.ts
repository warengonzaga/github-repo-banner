import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import bannerRoute from './routes/banner.js';
import uiRoute from './routes/ui.js';

const app = new Hono();

app.route('/', uiRoute);
app.route('/', bannerRoute);

const port = parseInt(process.env.PORT || '3000', 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`Banner server running at http://localhost:${info.port}`);
});
