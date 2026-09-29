import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { marked } from 'marked';
import { escapeXml } from '../utils/sanitize.js';

const uiRoute = new Hono();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Works in both dev (src/routes/) and production (dist/)
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
    const htmlPath = findHtmlPath();
    // Only repository-owned documents are rendered, never request-supplied Markdown.
    const readDocument = (filename: string) => {
      const path = [
        resolve(dirname(htmlPath), filename),
        resolve(dirname(htmlPath), '..', '..', filename),
      ].find(existsSync);
      if (!path) throw new Error(`Repository ${filename} is missing`);
      return readFileSync(path, 'utf-8');
    };
    cachedHtml = readFileSync(htmlPath, 'utf-8')
      .replace('<!-- repository-document:license -->', () =>
        escapeXml(readDocument('LICENSE')),
      )
      .replace('<!-- repository-document:conduct -->', () =>
        marked.parse(readDocument('CODE_OF_CONDUCT.md'), { async: false }),
      );
  }
  return c.html(cachedHtml);
});

export default uiRoute;
