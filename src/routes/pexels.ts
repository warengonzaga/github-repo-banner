import { Hono } from 'hono';

const pexelsRoute = new Hono();

const PEXELS_API_URL = 'https://api.pexels.com/v1';

pexelsRoute.get('/api/pexels/search', async (c) => {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Pexels API not configured' }, 503);
  }

  const query = (c.req.query('q') || 'nature').slice(0, 100);
  const page = Math.max(
    1,
    parseInt(c.req.query('page') || '1', 10) || 1,
  ).toString();
  const perPage = '9';
  const orientation = 'landscape';

  try {
    const url = `${PEXELS_API_URL}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=${orientation}`;
    const response = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!response.ok) {
      return c.json({ error: 'Pexels API error' }, 502);
    }

    const data = (await response.json()) as {
      photos: Array<{
        id: number;
        alt: string;
        photographer: string;
        src: { landscape: string; medium: string };
      }>;
      total_results: number;
      page: number;
    };

    const photos = data.photos.map((p) => ({
      id: p.id,
      alt: p.alt,
      photographer: p.photographer,
      url: p.src.landscape,
      thumb: p.src.medium,
    }));

    return c.json({
      photos,
      total: data.total_results,
      page: data.page,
    });
  } catch {
    return c.json({ error: 'Failed to fetch from Pexels' }, 500);
  }
});

export default pexelsRoute;
