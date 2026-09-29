import { escapeXml } from '../utils/sanitize.js';

type Page = 'generator' | 'docs' | 'usage';

export const privacyNotice = `<aside class="privacy-notice" aria-label="Privacy notice">
  <p>When enabled, optional statistics count page views, banner requests and estimated repositories to show public usage. No banner designs, IPs or visitor IDs are stored for statistics. <a href="/docs#overview-privacy-retention-and-opt-out">Privacy and opt-out choices</a>.</p>
</aside>`;

export function renderNavigation(current: Page): string {
  const links = [
    ['generator', '/', 'Generator'],
    ['docs', '/docs', 'Documentation'],
    ['usage', '/usage', 'Usage'],
  ];
  return `<header class="site-header">
    <a class="site-brand" href="/">GitHub Repo Banner</a>
    <nav class="site-nav" aria-label="Main navigation">${links
      .map(
        ([page, href, label]) =>
          `<a href="${href}"${page === current ? ' aria-current="page"' : ''}>${label}</a>`,
      )
      .join('')}</nav>
  </header>`;
}

export function renderPage(page: 'docs' | 'usage', content: string): string {
  const title = page === 'docs' ? 'Documentation' : 'Usage';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeXml(title)} for GitHub Repo Banner: customizable repository banners, self-hosting and transparent usage observations.">
  <title>${title} · GitHub Repo Banner</title>
  <link rel="stylesheet" href="/pages.css">
  ${page === 'usage' ? '<script type="module" src="/usage.js"></script>' : ''}
</head>
<body class="project-page">
  <a class="skip-link" href="#main">Skip to content</a>
  ${renderNavigation(page)}
  ${privacyNotice}
  <main id="main" class="page-main" tabindex="-1">${content}</main>
  <footer class="site-footer"><span>GitHub Repo Banner by <a href="https://github.com/warengonzaga">Waren Gonzaga</a></span><a href="https://github.com/warengonzaga/github-repo-banner">Source on GitHub</a><a href="/docs#overview-privacy-retention-and-opt-out">Privacy</a><a href="/docs#license">MIT license</a></footer>
</body>
</html>`;
}
