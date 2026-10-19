# GitHub Repo Banner

> URL-based repository banners. Think shields.io, but for headers. ✨

![GitHub Repo Banner](https://ghrb.waren.build/render/banner?header=%F0%9F%8E%A8%F0%9F%96%BC%EF%B8%8F&subheader=%E2%9C%A8+great+projects+deserve+great+repository+banners+%E2%9C%A8&bg=1a1a1a-4a4a4a&color=ffffff&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

I believe every repository deserves to look beautiful. Your code is art, your projects deserve stunning visuals to match. But design tools steal hours you don't have. So I built a service that generates gorgeous banners through simple URL parameters. Instant, customizable, and no design tools required. Because great projects deserve great repository banners.

[Create a banner](https://ghrb.waren.build) · [Documentation](https://ghrb.waren.build/docs) · [Stats](https://ghrb.waren.build/stats) · [API reference](docs/api.md) · [Self-hosting](docs/self-hosting.md) · [Brand guidelines](docs/brand.md) · [Agent skill](#-agent-skill) · [Terms](docs/terms.md) · [Privacy](docs/privacy.md)

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
- 📖 **Project pages** — Documentation at `/docs` and public usage stats at `/stats`.
- 🔒 **Simple usage stats** — Optional daily counts of successful banner renders; designs are not saved.
- 🐳 **Self-hosting** — Docker Compose with required Redis for persistent search caching and quota control.
- 🤖 **Agent skill** — Create banner URLs and README Markdown from compatible AI coding tools.

## 🚀 Quick Start

### Use the Hosted Service

1. Open [ghrb.waren.build](https://ghrb.waren.build).
2. Set your text, fonts, and background; optionally add custom images and check the live preview.
3. Choose **Copy Markdown** for your README, copy an image URL, or download SVG/PNG.
4. Copy the Markdown or image URL, or download SVG/PNG. Exports run in your browser; designs are not saved on the server.

You can also create a banner directly with a URL:

```markdown
![My Project](https://ghrb.waren.build/render/banner?header=My+Project&bg=1a1a1a-4a4a4a&color=ffffff)
```

### Self-Hosting

Use Docker Compose to run the app and its required Redis database:

```bash
git clone https://github.com/warengonzaga/github-repo-banner.git
cd github-repo-banner
cp .env.example .env
docker compose up --build -d
```

Open `http://localhost:3000`. Compose connects Redis automatically. Pexels search appears only when `PEXELS_API_KEY` is configured; direct image URLs remain available without a key. Stats are disabled by default. Redis remains required when tracking is off. See the [self-hosting guide](docs/self-hosting.md) for runtime variables and Railway setup.

## 📖 Usage Examples

### Backgrounds and Styling

Use `bg=HEX` for a solid color, `bg=HEX1-HEX2` for a gradient, or eight-digit `RRGGBBAA` hex for opacity. `bg=00000000` is fully transparent. Choose a preset in the UI.

Use `bgimg` for a direct public HTTPS image. The UI preserves your colors and presets while disabling them until you clear the image URL.

**Background styling** adjusts brightness, contrast, saturation, and grayscale without changing text, icons, or watermarks. Blur applies only to successfully loaded images. **Reset styling** restores neutral values while keeping your content; the main **Reset** restores all defaults. The effects travel with copied URLs and SVG/PNG downloads.

```text
https://ghrb.waren.build/render/banner?header=My+Project&bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg&bgblur=10&bgbrightness=60&bggrayscale=100&color=ffffff
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

Custom image settings, including rotation, follow the live preview, copied URLs/Markdown, and SVG/PNG downloads. See the [custom image API](docs/api.md#custom-icons-and-positioned-images) for parameter details.

### Pexels Integration

Search returns nine landscape thumbnails at a time. **Load more images** appends the next page until results end. A new search starts fresh; failed requests preserve existing choices for retry. Select photos with a mouse or Tab followed by Enter/Space.

For self-hosting, set `PEXELS_API_KEY` in the server environment. The key stays server-side. Without it, Pexels search is hidden while the direct image URL input remains available. See [configuration](docs/self-hosting.md#environment-variables).

### Watermark and Output

The UI enables the watermark by default; the API requires `support=true`. **Copy Markdown** and SVG/PNG downloads honor your choice, including the attribution comment in generated Markdown only when support is enabled. **Copy Image URL** keeps styling while intentionally omitting the watermark. The stats opt-out is included in generated banner links.

### Repository Documents

The **README** tab contains the generator. **Code of conduct** and **MIT license** display bundled repository documents. Tabs support keyboard navigation and adapt to narrow screens.

The main navigation opens **Documentation** and **Stats**. The stats page shows the current instance’s successful banner render count for today, or explains that tracking is disabled or unavailable. Counts are not unique views or people.

## 🔌 API Reference

See the [API reference](docs/api.md) for banner parameters and the `/render/banner`, `/api/health`, `/api/pexels/search`, and `/stats` routes. `/banner` remains a temporary alias for existing links.

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

The skill distinguishes generated URLs from verified renders and edits a README only when requested. `/render/banner` returns SVG; PNG export remains a browser-side UI feature. Maintain the skill reference alongside the route, sanitizer, renderer, and generator's Markdown behavior. Run `bun scripts/check-banner-skill.ts` to check the documented URL example against the route, encoding, limits, fallback, and package linkage.

## 🔒 Privacy & Transparency

Usage stats are disabled by default. When `ENABLE_STATS=true`, the app counts successful banner renders by UTC day. Counts expire seven days after their last write and appear on `/stats` as a public HTML page. They are request totals, not unique people or views; previews, bots, and retries may count. Cached requests that never reach the app are not counted.

A banner request can opt out with `stats=false`, `DNT: 1`, or `Sec-GPC: 1`. Copying and downloading run in your browser; the server does not save exported designs. See the [Privacy notice](docs/privacy.md) and [Terms](docs/terms.md).

## 🛠️ Development

Node.js · TypeScript · Hono · tsup · Bun

```bash
bun run check  # Static checks
bun run build      # Production build and declaration generation
```

Regression checks are in `scripts/check-*` (run `.ts` files with Bun and `.mjs` files with Node). CI runs static checks, the build, regression scripts with disposable Redis, and the Docker smoke check. See the [self-hosting guide](docs/self-hosting.md).

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
