import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { marked } from 'marked';
import { getRedis, isStatsEnabled } from '../config/redis.js';
import { renderDocumentation } from '../ui/documentation.js';
import { renderPage } from '../ui/pages.js';
import { escapeXml } from '../utils/sanitize.js';
import { getBannerRequestCount } from '../utils/usage-stats.js';

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
    cachedDocs = renderPage(renderDocumentation(readDocument));
  }
  return c.html(cachedDocs);
});

uiRoute.get('/usage', (c) => {
  c.header('Cache-Control', 'no-store');
  c.header('Referrer-Policy', 'no-referrer');
  return c.html(
    renderPage(
      `<div class="page-heading"><h1>Withdraw a shared design</h1><p class="page-intro">Use your saved removal link or code to remove an older shared design. New designs are not submitted to a showcase.</p></div>
<section class="doc-section" aria-labelledby="removal-heading">
  <h2 id="removal-heading">Remove a shared design</h2>
  <form id="showcase-remove">
    <label for="showcase-removal-code">Removal link or code</label>
    <input id="showcase-code" type="password" autocomplete="off" required spellcheck="false">
    <button class="page-button" type="submit">Remove from showcase</button>
    <p id="showcase-removal-status" role="status" aria-live="polite"></p>
  </form>
</section>
<script type="module">
const form = document.getElementById('showcase-remove');
const code = document.getElementById('showcase-code');
const status = document.getElementById('showcase-removal-status');
const pattern = /^\\d{13}-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\\.[a-f0-9]{64}$/;
const fragment = new URLSearchParams(location.hash.slice(1)).get('remove');
if (fragment && pattern.test(fragment)) {
  code.value = fragment;
  history.replaceState(null, '', location.pathname + location.search);
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (form.querySelector('button').disabled) return;
  let value = code.value.trim();
  if (value.includes('#remove=')) value = value.split('#remove=')[1];
  if (!pattern.test(value)) { status.textContent = 'Paste the complete removal link or code given when sharing.'; return; }
  const [id, token] = value.split('.');
  const button = form.querySelector('button');
  button.disabled = true;
  status.textContent = 'Removing this design…';
  try {
    const response = await fetch('/showcase/' + id, {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({removalToken:token}), signal:AbortSignal.timeout(10_000)});
    if (!response.ok) throw new Error((await response.json()).error);
    status.textContent = 'Removed from the showcase. Existing copies held by others cannot be recalled.';
    try {
      const codes = JSON.parse(localStorage.getItem('showcase-removal-codes') || '{}');
      if (codes && typeof codes === 'object' && !Array.isArray(codes)) {
        delete codes[id];
        localStorage.setItem('showcase-removal-codes', JSON.stringify(codes));
      }
    } catch {}
    code.value = '';
  } catch (error) { status.textContent = error instanceof Error ? error.message : 'Removal failed. Please try again.'; }
  finally { button.disabled = false; }
});
</script>`,
      'Remove a shared design',
    ),
  );
});

uiRoute.get('/image-url.js', (c) => {
  c.header('Content-Type', 'text/javascript; charset=utf-8');
  return c.body(readFileSync(findHtmlPath('image-url.js'), 'utf-8'));
});

uiRoute.get('/', async (c) => {
  if (!cachedHtml || isDev) {
    const htmlPath = findHtmlPath();
    cachedHtml = readFileSync(htmlPath, 'utf-8')
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
  let usageStatsSection = '';
  if (isStatsEnabled()) {
    const redis = getRedis();
    if (redis?.status === 'ready') {
      try {
        const count = await getBannerRequestCount(redis);
        if (Number.isSafeInteger(count) && count >= 0) {
          usageStatsSection = `<div class="sidebar-section"><h2>Usage stats</h2><p style="font-size: 0.875rem; margin-top: 0.75rem;">Today: <strong>${count.toLocaleString()}</strong> banner renders</p></div>`;
        } else {
          usageStatsSection =
            '<div class="sidebar-section"><h2>Usage stats</h2><p style="font-size: 0.875rem; margin-top: 0.75rem;">Usage stats are temporarily unavailable.</p></div>';
        }
      } catch {
        usageStatsSection =
          '<div class="sidebar-section"><h2>Usage stats</h2><p style="font-size: 0.875rem; margin-top: 0.75rem;">Usage stats are temporarily unavailable.</p></div>';
      }
    } else {
      usageStatsSection =
        '<div class="sidebar-section"><h2>Usage stats</h2><p style="font-size: 0.875rem; margin-top: 0.75rem;">Usage stats are temporarily unavailable.</p></div>';
    }
  }

  // Apply deployment capability after the cached template; never expose the key.
  return c.html(
    cachedHtml
      .replace('<!-- usage-stats-section -->', usageStatsSection)
      .replace(
        'id="pexels-section" hidden',
        process.env.PEXELS_API_KEY
          ? 'id="pexels-section"'
          : 'id="pexels-section" hidden',
      ),
  );
});

export default uiRoute;
