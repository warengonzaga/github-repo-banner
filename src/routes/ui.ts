import { Hono } from 'hono';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const uiRoute = new Hono();

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Find the HTML file path, works in both dev (src/) and production (dist/) environments
 * @returns Absolute path to index.html file
 */
function findHtmlPath(): string {
  const candidates = [
    resolve(__dirname, '..', 'ui', 'index.html'), // dev: src/routes/../ui/
    resolve(__dirname, 'ui', 'index.html'), // prod: dist/ui/
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
let cachedHtml: string | null = null;

uiRoute.get('/', (c) => {
  if (!cachedHtml || isDev) {
    cachedHtml = readFileSync(findHtmlPath(), 'utf-8');
  }
  return c.html(cachedHtml);
});

export default uiRoute;
