import { Marked, Renderer, type Token, type Tokens } from 'marked';
import { escapeXml } from '../utils/sanitize.js';

const repository = 'https://github.com/warengonzaga/github-repo-banner';
const chapters = [
  { path: 'README.md', id: 'overview', title: 'Project overview' },
  { path: 'docs/api.md', id: 'api', title: 'API reference' },
  { path: 'docs/self-hosting.md', id: 'self-hosting', title: 'Self-hosting' },
  { path: 'CONTRIBUTING.md', id: 'contributing', title: 'Contributing' },
  {
    path: 'CODE_OF_CONDUCT.md',
    id: 'code-of-conduct',
    title: 'Code of conduct',
  },
  { path: 'LICENSE', id: 'license', title: 'MIT license' },
];

function isHeading(token: Token): token is Tokens.Heading {
  return token.type === 'heading';
}

function plainText(tokens: Token[]): string {
  return tokens
    .map((token) => {
      if (token.type === 'html') return '';
      if ('tokens' in token && token.tokens) return plainText(token.tokens);
      if (!('text' in token)) return '';
      if (token.type === 'codespan' || token.type === 'escape')
        return token.text;
      return token.text.replace(
        /&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi,
        (entity: string) => {
          const named: Record<string, string> = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&apos;': "'",
          };
          if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
          const code =
            entity[2].toLowerCase() === 'x'
              ? Number.parseInt(entity.slice(3), 16)
              : Number.parseInt(entity.slice(2), 10);
          return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
        },
      );
    })
    .join('');
}

// Preserve GitHub's leading/doubled hyphens after removing emoji and punctuation.
function headingSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
    .replace(/[\u200d\ufe0e\ufe0f]/g, '')
    .replace(/\s/g, '-');
}

function permalink(id: string, label: string): string {
  return `<a class="text-link" href="#${escapeXml(id)}" aria-label="Link to ${escapeXml(label)}">#</a>`;
}

export function renderDocumentation(
  readDocument: (path: string) => string,
): string {
  // Only checked-in documents reach this renderer; request input is never Markdown.
  const marked = new Marked();
  const documents = chapters.map((chapter) => {
    const source = readDocument(chapter.path);
    const tokens = marked.lexer(source);
    const first = tokens.find((token) => token.type !== 'space');
    const initialHeading =
      first && isHeading(first) && first.depth === 1 ? first : null;
    const headings = new Map<Tokens.Heading, { id: string; label: string }>();
    const fragments = new Map<string, string>();
    marked.walkTokens(tokens, (token) => {
      if (!isHeading(token)) return;
      const label = plainText(token.tokens);
      const base = headingSlug(label) || 'section';
      let slug = base;
      for (let suffix = 1; fragments.has(slug); suffix++)
        slug = `${base}-${suffix}`;
      const id =
        token === initialHeading ? chapter.id : `${chapter.id}-${slug}`;
      fragments.set(slug, id);
      headings.set(token, { id, label });
    });
    return { ...chapter, source, tokens, initialHeading, headings, fragments };
  });

  const content = documents
    .map((document) => {
      const resolveLink = (href: string): string => {
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return href;
        const url = new URL(href, `https://repository.local/${document.path}`);
        const path = decodeURIComponent(url.pathname.slice(1));
        const target = documents.find((entry) => entry.path === path);
        if (target) {
          const fragment = decodeURIComponent(url.hash.slice(1));
          const id = fragment ? target.fragments.get(fragment) : target.id;
          if (id) return `#${id}`;
        }
        const kind =
          path.endsWith('/') || path === 'skills/github-repo-banner'
            ? 'tree'
            : 'blob';
        return `${repository}/${kind}/main/${url.pathname.slice(1)}${url.search}${url.hash}`;
      };

      let tableLabel = document.title;
      const renderer = new Renderer();
      const renderTable = renderer.table.bind(renderer);
      renderer.heading = (token) => {
        if (token === document.initialHeading) return '';
        const heading = document.headings.get(token);
        if (!heading) throw new Error(`Unindexed heading in ${document.path}`);
        tableLabel = heading.label;
        const depth = Math.min(token.depth + 1, 6);
        return `<h${depth} id="${escapeXml(heading.id)}">${renderer.parser.parseInline(token.tokens)} ${permalink(heading.id, heading.label)}</h${depth}>\n`;
      };
      renderer.link = (token) => {
        const title = token.title ? ` title="${escapeXml(token.title)}"` : '';
        return `<a href="${escapeXml(resolveLink(token.href))}"${title}>${renderer.parser.parseInline(token.tokens)}</a>`;
      };
      renderer.image = (token) => {
        const url = new URL(
          token.href,
          `https://raw.githubusercontent.com/warengonzaga/github-repo-banner/main/${document.path}`,
        );
        const isBanner =
          url.hostname === 'ghrb.waren.build' && url.pathname === '/banner';
        if (isBanner) url.searchParams.set('stats', 'false');
        const title = token.title ? ` title="${escapeXml(token.title)}"` : '';
        const dimensions = isBanner ? ' width="1280" height="304"' : '';
        return `<img src="${escapeXml(url.href)}" alt="${escapeXml(plainText(token.tokens))}" loading="lazy" decoding="async"${dimensions}${title}>`;
      };
      renderer.table = (token) =>
        `<div class="table-scroll" role="region" aria-label="${escapeXml(tableLabel)} table" tabindex="0">${renderTable(token)}</div>\n`;
      const body =
        document.path === 'LICENSE'
          ? `<pre>${escapeXml(document.source)}</pre>`
          : marked.parser(document.tokens, { renderer });
      return `<section class="doc-section" aria-labelledby="${document.id}">
<h2 class="section-heading" id="${document.id}">${document.title} ${permalink(document.id, document.title)}</h2>
<div class="prose">${body}</div>
</section>`;
    })
    .join('\n');

  const toc = `<ul>${documents
    .map((document) => {
      const subheadings = [...document.headings].filter(
        ([token]) => token.depth === 2,
      );
      const subsections = subheadings.length
        ? `<ul>${subheadings.map(([, heading]) => `<li><a href="#${escapeXml(heading.id)}">${escapeXml(heading.label)}</a></li>`).join('')}</ul>`
        : '';
      return `<li><a href="#${document.id}">${document.title}</a>${subsections}</li>`;
    })
    .join('')}</ul>`;

  return `<div class="page-heading"><h1>Documentation</h1>
<p class="page-intro">Create a banner, explore the API, or run your own instance. The project guides and policies are collected here in one place.</p></div>
<div class="docs-layout">
<nav class="docs-toc" aria-label="Documentation contents">
<div class="docs-toc-desktop"><p>On this page</p>${toc}</div>
<details class="docs-toc-mobile"><summary>On this page</summary>${toc}</details>
</nav>
<div class="docs-content">${content}</div>
</div>`;
}
