import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { marked } from 'marked';
import { renderDocumentation } from '../ui/documentation.js';
import { renderNavigation, renderPage } from '../ui/pages.js';
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
let cachedDocs: string | null = null;

// Only fixed, repository-owned paths reach this helper, never request input.
function readDocument(filename: string): string {
  const path = [
    resolve(dirname(findHtmlPath()), 'docs', filename),
    resolve(dirname(findHtmlPath()), filename),
    resolve(dirname(findHtmlPath()), '..', '..', filename),
  ].find(existsSync);
  if (!path) throw new Error(`Repository ${filename} is missing`);
  return readFileSync(path, 'utf-8');
}

for (const [path, type] of [
  ['pages.css', 'text/css; charset=utf-8'],
  ['image-layers.js', 'text/javascript; charset=utf-8'],
  ['image-layers.css', 'text/css; charset=utf-8'],
  ['image-settings.js', 'text/javascript; charset=utf-8'],
  ['inline-icons.js', 'text/javascript; charset=utf-8'],
  ['export.js', 'text/javascript; charset=utf-8'],
]) {
  uiRoute.get(`/${path}`, (c) => {
    c.header('Content-Type', type);
    return c.body(readFileSync(findHtmlPath(path), 'utf-8'));
  });
}

for (const [path, source, type] of [
  ['brand-logo.svg', 'svg/horizontal-dark.svg', 'image/svg+xml'],
  ['favicon.ico', 'web/favicon.ico', 'image/x-icon'],
  ['favicon.svg', 'web/favicon.svg', 'image/svg+xml'],
  ['apple-touch-icon.png', 'web/apple-touch-icon.png', 'image/png'],
  ['icon-192.png', 'web/icon-192.png', 'image/png'],
  ['icon-512.png', 'web/icon-512.png', 'image/png'],
  ['maskable-512.png', 'web/maskable-512.png', 'image/png'],
  ['site.webmanifest', 'web/site.webmanifest', 'application/manifest+json'],
]) {
  uiRoute.get(`/${path}`, (c) => {
    const uiDirectory = dirname(findHtmlPath());
    const candidates = [
      resolve(uiDirectory, path),
      resolve(uiDirectory, '..', '..', 'assets', 'brand', source),
    ];
    const filePath = candidates.find(existsSync);
    if (!filePath) throw new Error(`Brand asset ${source} is missing`);
    c.header('Content-Type', type);
    return c.body(readFileSync(filePath));
  });
}

uiRoute.get('/docs', (c) => {
  if (!cachedDocs || isDev) {
    cachedDocs = renderPage('docs', renderDocumentation(readDocument));
  }
  return c.html(cachedDocs);
});

uiRoute.get('/usage', (c) => c.redirect('/stats', 301));

uiRoute.get('/image-url.js', (c) => {
  c.header('Content-Type', 'text/javascript; charset=utf-8');
  return c.body(readFileSync(findHtmlPath('image-url.js'), 'utf-8'));
});

uiRoute.get('/', (c) => {
  if (!cachedHtml || isDev) {
    const htmlPath = findHtmlPath();
    cachedHtml = readFileSync(htmlPath, 'utf-8')
      .replace('<!-- site-navigation -->', () => renderNavigation('generator'))
      .replace(
        '<!-- sidebar-privacy -->',
        () =>
          'Learn how usage tracking works, what data is counted, and how this service is provided.',
      )
      .replace('<!-- repository-document:license -->', () =>
        escapeXml(readDocument('LICENSE')),
      )
      .replace('<!-- repository-document:conduct -->', () =>
        marked.parse(readDocument('CODE_OF_CONDUCT.md'), { async: false }),
      );
  }
  // Apply deployment capability after the cached template; never expose the key.
  return c.html(
    cachedHtml.replace(
      'id="pexels-section" hidden',
      process.env.PEXELS_API_KEY
        ? 'id="pexels-section"'
        : 'id="pexels-section" hidden',
    ),
  );
});

export default uiRoute;
