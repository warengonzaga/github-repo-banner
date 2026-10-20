import { escapeXml } from '../utils/sanitize.js';

export function renderNavigation(): string {
  return `<header class="site-header">
    <a class="site-brand" href="/" aria-label="GitHub Repo Banner home"><img src="/brand-logo.svg" alt="GitHub Repo Banner" width="240" height="79"></a>
  </header>`;
}

export function renderPage(content: string, title = 'Documentation'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeXml(title)} for GitHub Repo Banner: customizable repository banners, self-hosting and optional usage stats.">
  <title>${title} · GitHub Repo Banner</title>
  <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#0D1117">
  <link rel="stylesheet" href="/pages.css">
</head>
<body class="project-page">
  <a class="skip-link" href="#main">Skip to content</a>
  ${renderNavigation()}
  <main id="main" class="page-main" tabindex="-1">${content}</main>
  <footer class="site-footer"><span>GitHub Repo Banner by <a href="https://github.com/warengonzaga">Waren Gonzaga</a></span><a href="https://github.com/warengonzaga/github-repo-banner">Source on GitHub</a><a href="/docs#privacy">Privacy</a><a href="/docs#terms">Terms</a><a href="/docs#license">MIT license</a></footer>
</body>
</html>`;
}
