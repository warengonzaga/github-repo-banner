import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { escapeXml } from '../utils/sanitize.js';

const uiRoute = new Hono();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Works in both dev (src/routes/) and production (dist/)
function findHtmlPath(filename = 'index.html'): string {
  const candidates = [
    resolve(__dirname, '..', 'ui', filename), // dev: src/routes/../ui/
    resolve(__dirname, 'ui', filename), // prod: dist/ui/
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
let cachedHtml: string | null = null;

uiRoute.get('/image-url.js', (c) => {
  c.header('Content-Type', 'text/javascript; charset=utf-8');
  return c.body(readFileSync(findHtmlPath('image-url.js'), 'utf-8'));
});

uiRoute.get('/', (c) => {
  if (!cachedHtml || isDev) {
    const htmlPath = findHtmlPath();
    const licensePath = [
      resolve(dirname(htmlPath), 'LICENSE'),
      resolve(dirname(htmlPath), '..', '..', 'LICENSE'),
    ].find(existsSync);
    if (!licensePath) throw new Error('Repository LICENSE is missing');
    cachedHtml = readFileSync(htmlPath, 'utf-8').replace(
      '<!-- repository-document:license -->',
      () => escapeXml(readFileSync(licensePath, 'utf-8')),
    );
  }
  return c.html(cachedHtml);
});

export default uiRoute;
