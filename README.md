# GitHub Repo Banner

> URL-based repository banners. Think shields.io, but for headers. ✨

![GitHub Repo Banner](https://ghrb.waren.build/render/banner?header=%F0%9F%8E%A8%F0%9F%96%BC%EF%B8%8F&subheader=%E2%9C%A8+great+projects+deserve+great+repository+banners+%E2%9C%A8&bg=1a1a1a-4a4a4a&color=ffffff&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

I believe every repository deserves to look beautiful. Your code is art, your projects deserve stunning visuals to match. But design tools steal hours you don't have. So I built a service that generates gorgeous banners through simple URL parameters. Instant, customizable, and no design tools required. Because great projects deserve great repository banners.

[Create a banner](https://ghrb.waren.build) · [Documentation](https://ghrb.waren.build/docs) · [Public pages](docs/pages.md) · [Banner rendering](docs/rendering.md) · [API reference](docs/api.md) · [Self-hosting](docs/self-hosting.md) · [Brand guidelines](docs/brand.md) · [Agent skill](#-agent-skill) · [Terms](docs/terms.md) · [Privacy](docs/privacy.md)

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
- 📖 **Project pages** — Documentation at `/docs` and optional usage stats in the generator sidebar.
- 🔒 **Simple usage stats** — Optional daily counts of successful banner renders; designs are not saved.
- 🐳 **Self-hosting** — Docker Compose with required Redis for persistent search caching and quota control.
- 🤖 **Agent skill** — Create banner URLs and README Markdown from compatible AI coding tools.

## 🚀 Quick Start

### Use the Hosted Service

1. Open [ghrb.waren.build](https://ghrb.waren.build).
2. Set your text, fonts, and background; optionally add custom images and check the live preview.
3. Copy Markdown or an image URL, or download SVG/PNG. Exports run in your browser; designs are not saved on the server.

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

Open `http://localhost:3000`. See the [self-hosting guide](docs/self-hosting.md) for configuration, Railway deployment, and development commands.

## 📖 Usage Examples

### Backgrounds and Styling

Use color, gradient, image, and styling parameters to control the banner background.

```text
https://ghrb.waren.build/render/banner?header=My+Project&bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg&bgblur=10&bgbrightness=60&bggrayscale=100&color=ffffff
```

See [background effects and parameters](docs/rendering.md#background-effects).

### Custom Icons and Images

Add inline icons or freely positioned images from the generator:

```text
![icon src="https://example.com/logo.png" w="100%"] My Project
```

Use public HTTPS image URLs. See the [custom image settings](docs/rendering.md#custom-icons-and-positioned-images) for limits, positioning, rotation, and validation rules.

### Pexels Integration

Hosted and self-hosted instances can offer Pexels search when `PEXELS_API_KEY` is configured. Direct image URLs work without a key; see [self-hosting configuration](docs/self-hosting.md#environment-variables).

### Watermark and Output

The UI enables attribution by default. Use the output controls or `support=true` to control generated banner links; see the [Banner Rendering guide](docs/rendering.md).

### Repository Documents

The generator includes the repository README, Code of Conduct, and MIT license. Open the [Documentation](https://ghrb.waren.build/docs) page when you need the full guides. Usage stats appear in the generator sidebar when enabled.

## 🔌 API Reference

See the [public pages guide](docs/pages.md) for browser-facing routes and the [Banner Rendering guide](docs/rendering.md) for generated SVG URLs. The [API reference](docs/api.md) covers `/api/health` and `/api/pexels/search`.

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

Usage tracking is optional, and exported designs are not saved. Read the [Privacy Policy](docs/privacy.md) and [Terms of Service](docs/terms.md) for the complete details.

## 🛠️ Development

Node.js · TypeScript · Hono · tsup · Bun

```bash
bun run check  # Static checks
bun run build      # Production build and declaration generation
```

Regression checks are in `scripts/check-*` (run `.ts` files with Bun and `.mjs` files with Node). CI runs static checks, the build, regression scripts with disposable Redis, and the Docker smoke check. See the [self-hosting guide](docs/self-hosting.md).

## 🤝 Contributing

Contributions are welcome! For major changes, open an issue first.

1. Fork and clone the repository, then add the original repository as `upstream`.
2. Create a feature branch from `upstream/dev` (`git fetch upstream dev && git switch -c feature/amazing-feature upstream/dev`).
3. Commit with [Clean Commit](https://github.com/wgtechlabs/clean-commit) convention.
4. Push your branch and open a Pull Request targeting `dev`.

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 👨‍💻 Author

**Waren Gonzaga** • [GitHub](https://github.com/warengonzaga) • [Website](https://warengonzaga.com)

## 💖 Support the Project

If GitHub Repo Banner has been useful, you can support my open-source work by [sponsoring me on GitHub](https://github.com/sponsors/warengonzaga) or, if you think my work deserves wider recognition, [nominating me for the GitHub Stars program](https://stars.github.com/nominate). Both are optional—using and sharing the project helps too.

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com/) | [YHWH](https://www.youtube.com/watch?v=VOZbswniA-g) 🙏
