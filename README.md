# GitHub Repo Banner

> URL-based repository banners. Think shields.io, but for headers. ✨

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=%F0%9F%8E%A8%F0%9F%96%BC%EF%B8%8F&subheader=%E2%9C%A8+great+projects+deserve+great+repository+banners+%E2%9C%A8&bg=1a1a1a-4a4a4a&color=ffffff&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

I believe every repository deserves to look beautiful. Your code is art, your projects deserve stunning visuals to match. But design tools steal hours you don't have. So I built a service that generates gorgeous banners through simple URL parameters. Instant, customizable, and no design tools required. Because great projects deserve great repository banners.

[Create a banner](https://ghrb.waren.build) · [Documentation](https://ghrb.waren.build/docs) · [Public usage](https://ghrb.waren.build/usage) · [API reference](docs/api.md) · [Self-hosting](docs/self-hosting.md) · [Agent skill](#-agent-skill) · [Terms](docs/terms.md) · [Privacy](docs/privacy.md)

## 🚁 Deploy Your Own

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT&utm_medium=integration&utm_source=template&utm_campaign=generic)

When you deploy your own copy, you're directly supporting this project! 💖

## ✨ Features

- 🎨 **Backgrounds** — Solid colors, gradients, transparency, presets, and public HTTPS images.
- 📸 **Image search and styling** — Pexels search with more results, image blur, and background color filters.
- 🔤 **Typography** — Google Fonts, emoji, Simple Icons using `![slug]`, and inline custom images using `![icon src="https://…"]`.
- 🧩 **Custom Images** — Position multiple logos or decorations, resize and rotate them, preserve proportions, and arrange them behind or in front of text.
- 📥 **Output** — Live preview, README Markdown, image URLs, SVG, and PNG downloads.
- 💖 **Optional attribution** — Toggle the watermark and choose any corner.
- 📚 **Accessible controls** — Keyboard-selectable photos and responsive Code of conduct and MIT license tabs.
- 📖 **Project pages** — Single-page documentation at `/docs` and a readable public usage report at `/usage`.
- 🔒 **Transparent usage** — Aggregate counts and saved exports on the official service; optional counting on ordinary self-hosted instances.
- 🖼️ **Community showcase** — Choose to display an exported design on the Usage page, or export without sharing it.
- 🐳 **Self-hosting** — Docker Compose with required Redis for persistent search caching and quota control.
- 🤖 **Agent skill** — Create banner URLs and README Markdown from compatible AI coding tools.

## 🚀 Quick Start

### Use the Hosted Service

1. Open [ghrb.waren.build](https://ghrb.waren.build).
2. Set your text, fonts, and background; optionally add custom images and check the live preview.
3. Choose **Copy Markdown** for your README, copy an image URL, or download SVG/PNG.
4. On the official service, choose whether to showcase this design on the Usage page. Both choices save the exported design and count usage. Declining only keeps it out of the public showcase.

The official service records aggregate usage and saves designs from its built-in export controls as described in the [Terms](docs/terms.md) and [Privacy notice](docs/privacy.md). The showcase prompt asks only about public display.

You can also create a banner directly with a URL:

```markdown
![My Project](https://ghrb.waren.build/banner?header=My+Project&bg=1a1a1a-4a4a4a&color=ffffff)
```

### Self-Hosting

Use Docker Compose to run the app and its required Redis database:

```bash
git clone https://github.com/warengonzaga/github-repo-banner.git
cd github-repo-banner
cp .env.example .env
docker compose up --build -d
```

Open `http://localhost:3000`. Compose connects Redis automatically and keeps its data in a volume. Pexels search needs `PEXELS_API_KEY`; statistics are disabled by default. Redis remains required when tracking is off. See the [self-hosting guide](docs/self-hosting.md) for runtime variables, Railway, production builds, and release configuration. The API requires a running server; GitHub Pages alone cannot host it.

## 📖 Usage Examples

### Backgrounds and Styling

Use `bg=HEX` for a solid color, `bg=HEX1-HEX2` for a gradient, or eight-digit `RRGGBBAA` hex for opacity. `bg=00000000` is fully transparent. Choose a preset in the UI or browse the [preset table and examples](docs/api.md#color-presets).

Use `bgimg` for a direct public HTTPS image. The UI preserves your colors and presets while disabling them until you clear the image URL. Supported images are JPEG, PNG, GIF, WebP, and AVIF, up to 10 MiB and 16,777,216 decoded pixels across all frames; see [image requirements and fallback behavior](docs/api.md#custom-background-image).

**Background styling** adjusts brightness, contrast, saturation, and grayscale without changing text, icons, or watermarks. Blur applies only to successfully loaded images. **Reset styling** restores neutral values while keeping your content; the main **Reset** restores all defaults. The effects travel with copied URLs and SVG/PNG downloads.

```text
https://ghrb.waren.build/banner?header=My+Project&bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg&bgblur=10&bgbrightness=60&bggrayscale=100&color=ffffff
```

See the [API parameter table](docs/api.md#parameters) for ranges and defaults. Invalid effect values use defaults; neutral values preserve the original output.

### Custom Icons and Images

Put an image inline with header or subheader text:

```text
![icon src="https://example.com/logo.png" w="100%"] My Project
```

Replace the example URL with a direct public image URL. Optional `w` and `h` accept `1–304px` or `1–200%`; percentages follow the surrounding text size. With neither set, the icon follows the text height. With one set, the other preserves its proportions; with both set, the image fits inside that box. Oversized icons shrink to fit the available line space. Existing `![github]` icons and emoji still work alongside custom icons.

For freely positioned images, open **Custom Images** and choose **Add image**. Set X/Y from the banner's top-left and width/height in pixels on the 1280×304 canvas. **Rotation (degrees)** turns each image clockwise from 0° to 360° around its center, keeping the X/Y position and size as the unrotated box. Set 0° to reset its angle; 360° is a full turn. **Preserve proportions** fits inside the box; uncheck it to stretch. Choose **Behind text** or **In front of text**, then use **Lower layer**, **Raise layer**, or **Remove image**. Images crossing a banner edge, including after rotation, are cropped, and the watermark stays above them. New images start at `(0, 0)` in a 128×128 box at 0°, behind text. The main **Reset** clears them.

A banner supports five custom images total, including inline icons in both text fields. Each needs a public HTTPS URL of at most 512 characters and a PNG, JPEG, WebP, GIF, or AVIF download of at most 1 MiB and 16,777,216 decoded pixels across all frames. The image data must decode successfully and match its declared content type. SVG, redirects, credentials, and private addresses are not supported. Invalid or unavailable custom images show an error and block exports until fixed or removed.

Custom image settings, including rotation, follow the live preview, copied URLs/Markdown, SVG/PNG downloads, saved official exports, and optional showcase previews. Saved designs keep URLs and settings, not image binaries, so later previews depend on those images remaining available. See the [custom image API](docs/api.md#custom-icons-and-positioned-images) for parameter details.

### Pexels Integration

Search returns nine landscape thumbnails at a time. **Load more images** appends the next page until results end. A new search starts fresh; failed requests preserve existing choices for retry. Select photos with a mouse or Tab followed by Enter/Space.

For self-hosting, set `PEXELS_API_KEY` in the server environment. The key stays server-side. Without it, the search controls explain how to use a direct image URL instead. Direct images, filters, and the agent skill do not need a Pexels key. See [configuration](docs/self-hosting.md#environment-variables) and [search limits](docs/self-hosting.md#resource-limits).

### Watermark and Output

The UI enables the watermark by default; the API requires `support=true`. **Copy Markdown** and SVG/PNG downloads honor your choice, including the attribution comment in generated Markdown only when support is enabled. **Copy Image URL** keeps styling while intentionally omitting the watermark. On self-hosted instances with optional tracking, the statistics opt-out travels with all export formats. On the official service, exports count toward aggregate usage regardless of the showcase choice.

### Repository Documents

The **README** tab contains the generator. **Code of conduct** and **MIT license** display bundled repository documents. Tabs support keyboard navigation and adapt to narrow screens.

The main navigation opens **Documentation**, a single page assembled from this README, the API and self-hosting guides, contribution instructions and policies. **Usage** displays the current instance's daily page views and banner observations from `/stats` with refresh, raw JSON access, and coverage notes. Disabled or unavailable tracking is shown explicitly, never as a misleading zero. These observations do not measure individual users or prove how many projects depend on the service. The official Usage page also shows previews of designs their creators explicitly chose to showcase. These previews are rendered from saved settings; remote images or other assets can change. Creators can remove a showcase entry using its removal code.

## 🔌 API Reference

See the [API reference](docs/api.md) for all banner parameters, examples, presets, and responses from `/banner`, `/api/pexels/search`, `/health`, `/stats`, `/exports`, and the community showcase endpoints.

## 🌟 Who Uses This

Projects and organizations using GitHub Repo Banner:

- [gogcli](https://github.com/steipete/gogcli) by [steipete](https://github.com/steipete) - Google in your terminal
- [BetterGov PH](https://github.com/bettergovph/bettergov) - Making government services better for Filipinos

## 🤖 Agent Skill

The standalone `github-repo-banner` skill creates banner URLs and README Markdown using this service, with project branding and explicit preview checks. It needs no other Clean plugin or API key.

With a Codex version supporting plugins, install from the repository's marketplace:

```sh
codex plugin marketplace add warengonzaga/github-repo-banner
codex plugin add github-repo-banner@github-repo-banner
```

Start a fresh session after installation. For a local checkout, use `codex plugin marketplace add /absolute/path/to/github-repo-banner`.

Example requests:

```text
$github-repo-banner create a banner for this project's README using its existing colors, preview it, and give me the Markdown without editing files
$github-repo-banner use a transparent background and a GitHub icon, then replace the existing README banner
$github-repo-banner create a banner using my self-hosted base URL https://banners.example.com
```

Other Agent Skills-compatible hosts can load [`skills/github-repo-banner`](skills/github-repo-banner) directly. Copy the whole folder, including `references/`, into the host's documented skill directory; no plugin manifest is required for this mode. In Codex, a project-local direct installation can use `.agents/skills/github-repo-banner/`. Do not install both forms in the same project/session if that would expose duplicate skills.

The skill distinguishes generated URLs from verified renders and edits a README only when requested. `/banner` returns SVG; PNG export remains a separate interactive UI feature. Maintain the skill reference alongside the route, sanitizer, renderer, and generator's Markdown behavior. Run `bun scripts/check-banner-skill.ts` to check the documented URL example against the route, encoding, limits, fallback, and package linkage. This does not replace a fresh-session or visual check.

## 🔒 Privacy & Transparency

The **official hosted service records aggregate usage and saves every design submitted through its built-in export controls**. Choosing not to showcase does not disable counting or saving. Only an explicit showcase choice makes a preview available on the public Usage page. See the [Terms](docs/terms.md) and [Privacy notice](docs/privacy.md).

Self-hosted instances keep statistics disabled unless `ENABLE_STATS=true`. `OFFICIAL_HOSTED_INSTANCE=true` enables the official-service behavior and takes precedence over `ENABLE_STATS`. Redis remains required for Pexels caching and quota control. `/health` reports database availability and the tracking setting; `/stats` reports current storage availability and measurement definitions.

### What the metrics mean

- **Recorded page views**: successful origin `GET /`, `GET /docs`, and `GET /usage` responses, grouped by page. Refreshes, bots and prefetches can count; these are not unique visitors. Assets, API calls, stats refreshes, HEAD requests and failed page responses are excluded.
- **Recorded banner requests**: successful origin `GET /banner` renders whose aggregate write succeeds. Includes UI previews, bots, downloads, and retries. Requests answered by browser/CDN/GitHub image caches never reach this counter. It is not a view, user, installation, or adoption count. Showcase previews use a separate endpoint and do not increment this counter.
- **Recorded export requests**: requests from the generator's four export controls whose aggregate write succeeds, with a separate count for requests that save a showcase entry. These count accepted exports, not unique creators or proof that a clipboard write or download completed. Official exports save the design regardless of the showcase choice. Identical retries of a saved export do not count again.
- **Requests with a repository Referer**: recorded banner requests with a syntactically valid `https://github.com/owner/repo` Referer. Hostname and path are validated; queries/fragments are excluded and case is normalized. Headers can be missing or spoofed, and neither repository existence nor public visibility is verified.
- **Estimated unique repositories**: the approximate number of distinct normalized repository identifiers in those Referers, using Redis HyperLogLog (about 0.81% standard error). This is an observation estimate, not a complete repository count.
- **Repository Referer coverage**: the fraction of recorded banner requests with a usable repository Referer, or `null` when there are no requests. It does not estimate coverage of all real-world usage.

All metrics cover the **current UTC day**. First-recorded times identify when each kind of counting began; enabling statistics midday does not imply full-day coverage. Disabled periods, self-hosted opt-outs, Redis outages, and failed writes are omitted. Banner and page writes are asynchronous; recent responses may not appear immediately. Zero means no observations recorded for this window, not no users. Showcase browsing and removal do not add banner or export observations; opening `/usage` still counts as a page view.

### Privacy, retention, and opt-out

Measurement stores daily aggregate counters and a HyperLogLog sketch of SHA-256-hashed repository identifiers, not raw repository names, full Referers, banner text, IP addresses, cookies, sessions, or visitor identifiers. Daily keys expire seven days after their last write. Exported design records are separate: every official built-in export saves normalized settings and submission metadata, whether or not showcasing is chosen. These records are not exposed through the public gallery unless separately showcased.

Saved exports expire after the operator-configured `EXPORT_RETENTION_DAYS` period. Official mode requires an explicit value from 1 to 365 days and has no default. Storage holds at most 5,000 saved exports and admits 60 new exports per rolling minute; reaching either limit prevents a new official export until capacity is available, without discarding retained designs. A separate showcase copy remains public until the creator withdraws it or the operator removes it. Save the removal code; the browser may keep it locally to make removal easier. Withdrawing removes the public showcase copy and listing, but does not erase the saved export before its retention period ends or retract copies other people have already obtained. Do not publish secrets or content you lack permission to share. This project's MIT license does not automatically license user designs.

On the official service, `stats=false`, `DNT: 1`, and `Sec-GPC: 1` do not disable aggregate counting. The showcase prompt controls public display only. On self-hosted instances with optional tracking, use **Exclude this banner from usage statistics**, append `stats=false` to a banner or page URL, or send either header. The checkbox follows exported banner URLs; it does not undo earlier page views. A page's query choice applies to that request and is not carried through navigation links. No tracking preference is stored in a cookie.

Operational Pexels caches and quotas remain separate from usage counting. Hosting providers and reverse proxies may keep their own access logs. See the [Privacy notice](docs/privacy.md) for storage, retention, public sharing and removal details. The legacy `/log` endpoint still ignores old client payloads.

### Migration from the old statistics API

`/stats` now returns `schemaVersion: 2`. The old lifetime `totalRepositories` and `repositories` fields are replaced by the daily metrics described in the [API reference](docs/api.md); clients must update accordingly. Existing `repos:tracked` data is not imported into the new counters, read, or served. Operators should remove that legacy Redis key after any necessary backup; upgrading does not automatically delete existing data or historical infrastructure logs.

## 🛠️ Development

Node.js · TypeScript · Hono · tsup · Bun

```bash
bun run check  # Static checks
bun run build      # Production build and declaration generation
```

Regression checks are in `scripts/check-*` (run `.ts` files with Bun and `.mjs` files with Node). CI runs static checks, the build, regression scripts with disposable Redis, and the Docker smoke check. See [CI and releases](docs/self-hosting.md#ci-and-release-workflow), [security](docs/self-hosting.md#security), and [resource limits](docs/self-hosting.md#resource-limits).

## 🤝 Contributing

Contributions are welcome! For major changes, open an issue first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit with [Clean Commit](https://github.com/wgtechlabs/clean-commit) convention
4. Push and open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 👨‍💻 Author

**Waren Gonzaga** • [GitHub](https://github.com/warengonzaga) • [Website](https://warengonzaga.com)

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com/) | [YHWH](https://www.youtube.com/watch?v=VOZbswniA-g) 🙏
