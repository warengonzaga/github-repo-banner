import { getExportRetentionDays, isOfficialInstance } from '../config/redis.js';
import { escapeXml } from '../utils/sanitize.js';

type Page = 'generator' | 'docs' | 'usage';

export function privacyNotice(): string {
  return `<aside class="privacy-notice" aria-label="Privacy notice"><p>${
    isOfficialInstance()
      ? `Official hosting counts page views, banner requests and exports, and saves every exported design for ${getExportRetentionDays()} days. The prompt only controls public showcasing on the Usage page; showcase copies remain until removed.`
      : 'This self-hosted instance uses optional aggregate usage statistics. Exporting does not save a design or publish it to a showcase.'
  }
    <a href="/docs#privacy">Privacy</a> · <a href="/docs#terms">Terms</a></p></aside>`;
}

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
<body class="project-page" data-official="${isOfficialInstance()}">
  <a class="skip-link" href="#main">Skip to content</a>
  ${renderNavigation(page)}
  ${privacyNotice()}
  <main id="main" class="page-main" tabindex="-1">${content}</main>
  <footer class="site-footer"><span>GitHub Repo Banner by <a href="https://github.com/warengonzaga">Waren Gonzaga</a></span><a href="https://github.com/warengonzaga/github-repo-banner">Source on GitHub</a><a href="/docs#privacy">Privacy</a><a href="/docs#terms">Terms</a><a href="/docs#license">MIT license</a></footer>
</body>
</html>`;
}
