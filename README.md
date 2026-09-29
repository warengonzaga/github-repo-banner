# GitHub Repo Banner

> URL-based repository banners. Think shields.io, but for headers. ✨

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=%F0%9F%8E%A8%F0%9F%96%BC%EF%B8%8F&subheader=%E2%9C%A8+great+projects+deserve+great+repository+banners+%E2%9C%A8&bg=1a1a1a-4a4a4a&color=ffffff&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

I believe every repository deserves to look beautiful. Your code is art, your projects deserve stunning visuals to match. But design tools steal hours you don't have. So I built a service that generates gorgeous banners through simple URL parameters. Instant, customizable, and no design tools required. Because great projects deserve great repository banners.

## 🚁 Deploy Your Own

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT&utm_medium=integration&utm_source=template&utm_campaign=generic)

When you deploy your own copy, you're directly supporting this project! 💖

## ✨ Features

- 🎨 **Hex-Based Customization** - Full control with hex codes for backgrounds, gradients, and text colors
- 🌈 **Gradient Support** - Create custom gradients using `bg=HEX1-HEX2` format
- 💧 **Opacity Control** - 8-digit hex codes with alpha channel (RRGGBBAA)
- 🔤 **Google Fonts Integration** - Use any font from Google Fonts for custom typography
- 😀 **Native Emoji** - Full emoji support with proper rendering
- 🎯 **Simple Icons Support** - Use 3000+ brand icons with `![slug]` syntax (e.g., `![github]`, `![react]`)
- 📥 **SVG & PNG Download** - Download banners as SVG or PNG directly from the UI
- ⚡ **Lightning Fast** - Built with Hono framework for optimal performance
- 🔒 **Secure** - Input sanitization and validation
- 🖼️ **Background Images** - Use public HTTPS raster images as banner backgrounds via `bgimg`
- 📸 **Background Styling** - Blur images and adjust background brightness, contrast, saturation, and grayscale
- 📸 **Pexels Integration** - Search, load more results, and select photos with a mouse or keyboard
- 💖 **Optional Attribution** - Toggle the watermark and choose one of four corner positions
- 📚 **Repository Documents** - Read the Code of conduct and MIT license in responsive, keyboard-accessible tabs
- 🔒 **Optional Usage Statistics** - Daily aggregate observations with explicit coverage limits and per-banner opt-out
- 🤖 **Agent Skill** - Generate banner URLs and README Markdown from compatible AI coding tools
- 🚂 **Self-Hosting** - Run the Node.js service locally or deploy directly from GitHub on Railway

## 🚀 Quick Start

### Use the Hosted Service

Visit [ghrb.waren.build](https://ghrb.waren.build) to create your banner using the interactive UI.

### Self-Hosting

Use Node.js 22 and Bun 1.3.9 (the version pinned by this project).

```bash
git clone https://github.com/warengonzaga/github-repo-banner.git
cd github-repo-banner
bun install --frozen-lockfile
cp .env.example .env
bun dev
```

Open `http://localhost:3000`. Set optional variables in `.env` before starting the server; production deployments should set them in the service's runtime environment. For a production build, run `bun build`, then `bun start` with `NODE_ENV=production`.

The banner API and Pexels proxy require the running server. GitHub Pages alone cannot run these endpoints, and a GitHub Actions secret does not automatically become a Railway runtime variable.

## 📖 Usage Examples

### Basic Examples

**Gradient Background**

```text
https://ghrb.waren.build/banner?header=Vibe+Coding%F0%9F%9A%80&bg=ec4899-3b82f6&color=ffffff
```

![Gradient Example](https://ghrb.waren.build/banner?header=Vibe+Coding%F0%9F%9A%80&bg=ec4899-3b82f6&color=ffffff)

**Solid Color with Subheader**

```text
https://ghrb.waren.build/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=E7F9FF&color=0060A0
```

![Solid Color Example](https://ghrb.waren.build/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=E7F9FF&color=0060A0)

**With Emojis & Custom Fonts**

```text
https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&headerfont=Roboto&subheaderfont=Inter&support=true
```

![Emoji Example](https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&headerfont=Roboto&subheaderfont=Inter&support=true)

**With Brand Icons (Simple Icons)**

```text
https://ghrb.waren.build/banner?header=![github]+Hello+World&bg=1a1a1a-4a4a4a&color=ffffff
https://ghrb.waren.build/banner?header=![react]+![typescript]+Modern+Stack&bg=14b8a6-06b6d4&color=ffffff
```

![Icon Example](https://ghrb.waren.build/banner?header=![github]+Hello+World&bg=1a1a1a-4a4a4a&color=ffffff)

> Use `![slug]` syntax to embed any icon from [Simple Icons](https://simpleicons.org). Over 3000+ brand icons available! Icons automatically adapt to your text color.

**Transparent/Opacity**
  
```text
https://ghrb.waren.build/banner?header=Transparent&bg=00000000&color=ffffff
https://ghrb.waren.build/banner?header=Semi-Transparent&bg=ffffff80&color=000000
```

**Custom Background Image**

```text
https://ghrb.waren.build/banner?header=My+Project&bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg&color=ffffff
```

Use a direct public HTTPS URL serving JPEG, PNG, GIF, WebP, or AVIF, up to 10 MiB. URLs containing credentials, blocked private addresses, redirects, and SVG images are not supported. The server embeds the image as base64 and scales it to cover the banner. An invalid URL uses the `bg` selection; an accepted URL whose download fails uses the default gradient.

When the UI accepts an image URL, it disables background colors and presets while preserving their values. Clear the image URL to use those settings again.

### Pexels Integration

The UI includes a built-in Pexels image search. To enable it, set the `PEXELS_API_KEY` environment variable with your [Pexels API key](https://www.pexels.com/api/). Search results display nine landscape-oriented thumbnails at a time. Select an image to use it, or choose **Load more images** to append the next page until no more results are available. A new search starts fresh; loading failures keep existing choices available for retry. Use Tab to focus a thumbnail, then Enter or Space to select it.

`PEXELS_API_KEY` stays on the server. Without it, the search controls remain visible and explain how to use a direct image URL instead. A key is needed only for Pexels search, not for direct image URLs, background filters, or the agent skill.

### Background Styling

Use the Background styling controls to adjust the background without changing text, icons, or watermarks. Color filters work on solid colors, gradients, and images. Blur is enabled for HTTPS image URLs and applied only when the server successfully loads the image. Transparent backgrounds remain transparent. **Reset styling** restores neutral values without clearing the selected image or text; the main Reset button resets everything.

See the [banner parameter table](#parameters) for ranges and defaults.

Non-finite, non-numeric, and out-of-range values fall back to the parameter's default. Effects are applied in the order blur, brightness, contrast, then saturation/grayscale. Neutral parameters are omitted from generated URLs and preserve existing output. Styling is encoded in the banner URL and embedded as native SVG filters for the preview, SVG downloads, and PNG exports.

```text
https://ghrb.waren.build/banner?header=My+Project&bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg&bgblur=10&bgbrightness=60&bggrayscale=100&color=ffffff
```

### Watermark and Output

The UI enables the support watermark by default; the API enables it only with `support=true`. Choose any corner while it is enabled. **Copy Markdown**, SVG download, and PNG download honor the selected watermark state. Generated Markdown adds the attribution comment only when support is enabled. **Copy Image URL** preserves fonts, colors, background effects, and the statistics opt-out, while intentionally omitting the watermark.

### Repository Documents

The **README** tab contains the generator. **Code of conduct** and **MIT license** display the repository's bundled documents. Tabs support keyboard navigation and adapt to narrow screens.

## 🌟 Who Uses This

Projects and organizations using GitHub Repo Banner:

- [gogcli](https://github.com/steipete/gogcli) by [steipete](https://github.com/steipete) - Google in your terminal
- [BetterGov PH](https://github.com/bettergovph/bettergov) - Making government services better for Filipinos

## 🔒 Privacy & Transparency

Statistics are disabled unless `ENABLE_STATS=true` and Redis is configured and available. `/health` reports whether statistics were initialized; `/stats` reports current storage availability and the measurement definitions. The UI shows current-day observations with their limitations.

### What the metrics mean

- **Recorded banner requests**: successful origin `GET /banner` renders whose aggregate write succeeds. Includes UI previews, bots, downloads, and retries. Requests answered by browser/CDN/GitHub image caches never reach this counter. It is not a view, user, installation, or adoption count.
- **Requests with a repository Referer**: recorded requests with a syntactically valid `https://github.com/owner/repo` Referer. Hostname and path are validated; queries/fragments are excluded and case is normalized. Headers can be missing or spoofed, and neither repository existence nor public visibility is verified.
- **Estimated unique repositories**: the approximate number of distinct normalized repository identifiers in those Referers, using Redis HyperLogLog (about 0.81% standard error). This is an observation estimate, not a complete repository count.
- **Repository Referer coverage**: the fraction of recorded requests with a usable repository Referer, or `null` when there are no requests. It does not estimate coverage of all real-world usage.

All metrics cover the **current UTC day**. `firstRecordedAt` marks its first stored request, so enabling statistics midday does not imply full-day coverage. Disabled periods, opt-outs, Redis outages, and failed writes are omitted. Writes are asynchronous; recent responses may not appear immediately. Zero means no observations recorded for this window, not no users.

### Privacy, retention, and opt-out

Only daily request counters and a HyperLogLog sketch of SHA-256-hashed repository identifiers are stored. Names are hashed before they reach Redis; raw repository names/lists, full Referers, banner text/URLs, IP addresses, cookies, sessions, and user identifiers are not stored by this measurement. Daily keys expire seven days after their last write. Hashes and aggregate estimates are not proof of anonymous individuals or verified public repositories.

Button-click and banner-URL logging has been removed. The legacy `/log` endpoint accepts old clients without reading or logging their payload. Hosting providers and reverse proxies may maintain their own access logs; configure those separately.

Use the UI's **Exclude this banner from usage statistics** checkbox, or append `stats=false` to any banner URL. This choice travels with copied Markdown and image URLs and downloads. The service also honors `DNT: 1` and `Sec-GPC: 1` request headers. The checkbox applies to the current page and generated URLs; it is not stored in a cookie. Self-hosted instances keep statistics disabled by default.

### Migration from the old statistics API

`/stats` now returns `schemaVersion: 2`. The old lifetime `totalRepositories` and `repositories` fields are replaced by the daily, explicitly estimated metrics below; clients must update accordingly. Existing `repos:tracked` data is not imported into the new counters, read, or served. Operators should remove that legacy Redis key after any necessary backup; upgrading does not automatically delete existing data or historical infrastructure logs.

## 🚂 Railway Deployment

### Basic Deployment (Stats Disabled - Default)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT)

No additional configuration needed. The service runs without stats tracking.

### With Stats Tracking (Optional)

If you want aggregate usage observations for your instance:

1. **Deploy the service** using the button above
2. **Add Redis service** in Railway dashboard:
   - Click "New" → "Database" → "Add Redis"
   - Set `REDIS_URL` on the banner service to the Redis service connection URL
3. **Enable stats** in your service variables:
   - Go to your service settings
   - Add variable: `ENABLE_STATS=true`
4. **Redeploy** your service

**Accessing Stats:**
- View at: `https://your-service.railway.app/stats`
- Health check includes stats status: `https://your-service.railway.app/health`

Redis is optional and only used for statistics. Image caching and Pexels throttling use process-local memory.

## 🔌 API Reference

### `GET /banner`

Generate a custom SVG banner.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `header` | string | No | "Hello World" | Main text (supports emojis and icons) |
| `subheader` | string | No | - | Optional subtitle text |
| `bg` | string | No | `1a1a1a-4a4a4a` | Background color in hex format |
| `color` | string | No | `ffffff` | Header text color (hex without #) |
| `subheadercolor` | string | No | Same as `color` | Subheader text color |
| `headerfont` | string | No | - | Google Fonts family name for header (e.g., "Roboto") |
| `subheaderfont` | string | No | - | Google Fonts family name for subheader (e.g., "Playfair Display") |
| `bgimg` | string | No | - | Valid public HTTPS raster image URL (takes priority over `bg`, max 2048 URL units and 10 MiB download) |
| `bgblur` | number | No | `0` | Blur a loaded image, 0–30 pixels |
| `bgbrightness` | number | No | `100` | Background brightness, 0–200 percent |
| `bgcontrast` | number | No | `100` | Background contrast, 0–200 percent |
| `bgsaturation` | number | No | `100` | Background saturation, 0–200 percent |
| `bggrayscale` | number | No | `0` | Background grayscale, 0–100 percent |
| `support` | boolean | No | `false` | Show support watermark |
| `stats` | boolean | No | `true` | Set `false` to exclude this banner request from optional usage statistics |
| `watermarkpos` | string | No | `bottom-right` | Watermark position: `top-left`, `top-right`, `bottom-left`, `bottom-right` |

Header and subheader display text are limited to 50 and 60 JavaScript string units respectively, with at most five icons per field and a 500-unit raw-input cap. Font names are sanitized and limited to 50 units. Encode query values, especially embedded image URLs containing their own `&` or `#`; `URLSearchParams` handles this when building URLs in code.

#### Background Format

| Format | Example | Description |
|--------|---------|-------------|
| Gradient | `1a1a1a-4a4a4a` | Two hex colors separated by `-`, left to right |
| Solid | `ffffff` | Single hex color |
| Transparent | `00000000` | Fully transparent |
| With Opacity | `ffffff80` | `RRGGBBAA` (about 50% opacity) |
| Image URL | `bgimg=https://...` | Public HTTPS raster image (fetched and embedded as base64) |

#### Response

- **Content-Type**: `image/svg+xml`
- **Cache-Control**: `public, max-age=86400, s-maxage=86400` (production)
- **Size**: 1280×304px

### `GET /`

Interactive banner generator UI with live preview.

### `GET /api/pexels/search`

Server-side Pexels search. Accepts `q` (default `nature`, normalized and limited to 100 units) and `page` (default 1). Returns up to nine landscape photos per page:

```json
{
  "photos": [
    {
      "id": 123,
      "alt": "Example landscape",
      "photographer": "Example photographer",
      "url": "https://images.example.com/landscape.jpg",
      "thumb": "https://images.example.com/thumbnail.jpg"
    }
  ],
  "total": 10,
  "page": 1,
  "hasMore": true
}
```

The image URLs above are illustrative. Request the next page while `hasMore` is true; an empty page ends pagination. Missing server configuration returns HTTP 503, exhausted local capacity/budget returns 429 with `Retry-After: 60`, and upstream failures return 500. See [Resource limits](#resource-limits).

### `GET /health`

Health check endpoint for monitoring and stats status.

**Response (stats disabled):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T00:00:00.000Z",
  "stats": {
    "enabled": false
  }
}
```

**Response (stats enabled):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T00:00:00.000Z",
  "stats": {
    "enabled": true,
    "endpoint": "/stats"
  }
}
```

### `GET /stats`

Returns current UTC-day aggregate observations with `Cache-Control: no-store`. Disabled instances return `{ "schemaVersion": 2, "enabled": false, "message": "Stats tracking is disabled" }`. Unavailable storage returns HTTP 503 with `available: false`, rather than a misleading zero.

Example enabled response (the API also includes detailed `note` and `privacy` fields):

```json
{
  "schemaVersion": 2,
  "enabled": true,
  "available": true,
  "window": {
    "day": "2026-09-29",
    "timezone": "UTC",
    "firstRecordedAt": "2026-09-29T08:00:00.000Z"
  },
  "recordedBannerRequests": 100,
  "requestsWithRepositoryReferer": 20,
  "estimatedUniqueRepositories": 12,
  "repositoryRefererCoverage": 0.2,
  "coverage": "partial"
}
```

See [Privacy & Transparency](#-privacy--transparency) for definitions, exclusions, retention, opt-out, and legacy-data migration.

## 🎨 Color Presets

The UI includes presets for quick access:

### Gradients

| Name | Background | Text Color | Preview |
|------|------------|------------|---------|
| Midnight | `1a1a1a-4a4a4a` | `ffffff` | ![Midnight](https://ghrb.waren.build/banner?header=Midnight&bg=1a1a1a-4a4a4a&color=ffffff) |
| Vibe | `ec4899-3b82f6` | `ffffff` | ![Vibe](https://ghrb.waren.build/banner?header=Vibe&bg=ec4899-3b82f6&color=ffffff) |
| Ocean | `14b8a6-06b6d4` | `ffffff` | ![Ocean](https://ghrb.waren.build/banner?header=Ocean&bg=14b8a6-06b6d4&color=ffffff) |
| Railway | `431586-9231A8` | `ffffff` | ![Railway](https://ghrb.waren.build/banner?header=Railway&bg=431586-9231A8&color=ffffff) |
| Cloudflare | `F38020-FBAB41` | `ffffff` | ![Cloudflare](https://ghrb.waren.build/banner?header=Cloudflare&bg=F38020-FBAB41&color=ffffff) |
| Waren | `013B84-016EEA` | `ffffff` | ![Waren](https://ghrb.waren.build/banner?header=Waren&bg=013B84-016EEA&color=ffffff) |
| OSSPH | `E7F9FF-90C4E8` | `0060A0` | ![OSSPH](https://ghrb.waren.build/banner?header=OSSPH&bg=E7F9FF-90C4E8&color=0060A0) |

### Solid Colors

| Name | Background | Text Color | Preview |
|------|------------|------------|---------|
| Sky | `87ceeb` | `1e3a8a` | ![Sky](https://ghrb.waren.build/banner?header=Sky&bg=87ceeb&color=1e3a8a) |
| Molty | `fee2e2` | `bb2c2c` | ![Molty](https://ghrb.waren.build/banner?header=Molty&bg=fee2e2&color=bb2c2c) |
| Claude | `fde8e3` | `de7356` | ![Claude](https://ghrb.waren.build/banner?header=Claude&bg=fde8e3&color=de7356) |
| GPT | `10a37f` | `ffffff` | ![GPT](https://ghrb.waren.build/banner?header=GPT&bg=10a37f&color=ffffff) |
| Minimal | `f3f4f6` | `1f2937` | ![Minimal](https://ghrb.waren.build/banner?header=Minimal&bg=f3f4f6&color=1f2937) |

### Special

| Name | Background | Text Color | Preview |
|------|------------|------------|---------|
| Transparent | `00000000` | `ffffff` | ![Transparent](https://ghrb.waren.build/banner?header=Transparent&bg=00000000&color=ffffff) |

> **Tip:** Create any custom gradient or color using hex codes directly in the URL.

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

## 🛠️ Development

Recording failures emit a payload-free operational error. The affected process returns `/stats` as unavailable for the remainder of that UTC day, since later writes cannot recover lost observations. This health signal is process-local and resets on restart; it is not fleet-wide monitoring. Counter and cardinality reads use one Redis transaction.

### Tech Stack

**Runtime**: Node.js • **Framework**: [Hono](https://hono.dev/) • **Language**: TypeScript • **Build**: tsup • **Package Manager**: Bun

### CI and release workflow

`.github/workflows/build-flow.yml` calls Build Flow's CI reusable workflow pinned to the v0.2.1 commit. It keeps Node 22, Bun 1.3.9, frozen dependency installation, `bun run check`, and `bun run build` (including declaration generation). Regression scripts are available under `scripts/check-*`, but CI does not currently run them. There is no separate test, coverage, or typecheck command in the pipeline; the reusable workflow's defaults are explicitly overridden to preserve that behavior. The existing `Build` check name remains as a CI-dependent gate.

Only a push to `main` can release, after the Build gate succeeds. The pinned Release Build Flow Action v1.8.0 uses `GH_PAT` for version and changelog updates, tags, GitHub Releases, and downstream release-event compatibility. The separate CI and release workflow files are replaced by this single workflow to avoid duplicate release jobs.

Railway handles application builds and deployments directly from the GitHub repository. Package and container registry publishing are not part of this workflow; no Dockerfile or full `app.yml` orchestration is needed. This CI-plus-release configuration is the intended scope of issue #52.

### Commands

```bash
bun dev      # Development with hot-reload
bun build    # Production build
bun start    # Start production server
```

### Environment Variables

```env
PORT=3000              # Server port
NODE_ENV=development   # Environment mode

# Stats Tracking (disabled by default - privacy-first)
ENABLE_STATS=false     # Daily aggregate observations, not individual tracking
REDIS_URL=             # Required only if ENABLE_STATS=true

# Optional server-side image search
PEXELS_API_KEY=         # Required only for Pexels search
```

See [`.env.example`](.env.example) for runtime configuration. `GH_PAT` belongs in GitHub Actions secrets for the release workflow; it is separate from these application variables.

### Security

- Input sanitization (XSS prevention)
- Hex color validation
- Header length limits
- Shared image URL validation and public-address checks before HTTPS downloads
- Image content-type, size, timeout, cache, and concurrency limits
- Pexels credentials stay server-side; cached searches and request budgets reduce upstream calls

Fonts, icons, emoji assets, and remote images can depend on external services. Unavailable assets may fall back; deployments need outbound access for these features.

### Resource limits

Background image downloads share a process-local 32 MiB accounted-string cache with a 60-second TTL and at most four concurrent fetches. Requests for the same URL share in-flight work; saturation or failed downloads use the existing fallback. Each download remains limited to 10 MiB. These limits bound retained image data, not total process memory.

Pexels responses use a process-local 2 MiB cache for five minutes, four concurrent fetches, and a rolling budget of 100 upstream requests per hour. Queries are normalized before caching. Cached results do not consume that budget; excess uncached requests receive HTTP 429. Replicas sharing a Pexels key need a shared limiter to enforce an account-wide budget; process restart resets the local budget.

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
