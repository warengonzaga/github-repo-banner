import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { marked } from 'marked';
import {
  getExportRetentionDays,
  getRedis,
  isOfficialInstance,
  isStatsEnabled,
} from '../config/redis.js';
import { renderDocumentation } from '../ui/documentation.js';
import { privacyNotice, renderNavigation, renderPage } from '../ui/pages.js';
import { escapeXml } from '../utils/sanitize.js';
import { recordPageView, usageOptedOut } from '../utils/usage-stats.js';

const uiRoute = new Hono();

const trackedPages = {
  '/': 'generator',
  '/docs': 'documentation',
  '/usage': 'usage',
} as const;

uiRoute.use('*', async (c, next) => {
  await next();
  const page = trackedPages[c.req.path as keyof typeof trackedPages];
  const redis = getRedis();
  if (
    page &&
    c.req.method === 'GET' &&
    c.res.status === 200 &&
    isStatsEnabled() &&
    redis?.status === 'ready' &&
    !usageOptedOut(
      c.req.query('stats'),
      c.req.header('dnt'),
      c.req.header('sec-gpc'),
    )
  ) {
    // Count only rendered pages, never assets, API polling or client identifiers.
    void recordPageView(redis, page);
  }
});

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
  ['usage.js', 'text/javascript; charset=utf-8'],
  ['export.js', 'text/javascript; charset=utf-8'],
  ['showcase.js', 'text/javascript; charset=utf-8'],
]) {
  uiRoute.get(`/${path}`, (c) => {
    c.header('Content-Type', type);
    return c.body(readFileSync(findHtmlPath(path), 'utf-8'));
  });
}

uiRoute.get('/docs', (c) => {
  if (!cachedDocs || isDev) {
    cachedDocs = renderPage('docs', renderDocumentation(readDocument));
  }
  return c.html(cachedDocs);
});

uiRoute.get('/usage', (c) =>
  c.html(
    renderPage('usage', readFileSync(findHtmlPath('usage.html'), 'utf-8')),
  ),
);

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
        '<body>',
        `<body data-official="${isOfficialInstance()}" data-retention="${getExportRetentionDays() || 0}">`,
      )
      .replace('<!-- privacy-notice -->', () => privacyNotice())
      .replace('<!-- export-privacy -->', () =>
        isOfficialInstance()
          ? `Exports are counted and their designs are saved for ${getExportRetentionDays()} days. The prompt only asks about public showcasing. Choosing Export only keeps it off the Usage page. Shared showcase copies remain until removed.`
          : 'Exporting does not store your design. Usage statistics are optional on self-hosted instances.',
      )
      .replace('<!-- sidebar-privacy -->', () =>
        isOfficialInstance()
          ? 'Official hosting records aggregate usage. Every exported design is saved. The Usage page displays a design only when you explicitly accept showcasing it.'
          : 'When enabled, optional statistics count page views and banner requests. Exports do not save banner designs. No IPs, cookies or visitor identifiers are stored for these counts.',
      )
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
