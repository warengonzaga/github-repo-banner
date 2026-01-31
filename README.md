# GitHub Repo Banner

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=%F0%9F%8E%A8%F0%9F%96%BC%EF%B8%8F&subheader=%E2%9C%A8+great+projects+deserve+great+presentation+%E2%9C%A8&bg=1a1a1a-4a4a4a&color=ffffff&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

I believe every repository deserves to look beautiful. Your code is art, your projects deserve stunning visuals to match. But design tools steal hours you don't have. So I built a service that generates gorgeous banners through simple URL parameters. Instant, customizable, and no design tools required. Because great projects deserve great presentation.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT&utm_medium=integration&utm_source=template&utm_campaign=generic)

## ✨ Features

- 🎨 **Hex-Based Customization** - Full control with hex codes for backgrounds, gradients, and text colors
- 🌈 **Gradient Support** - Create custom gradients using `bg=HEX1-HEX2` format
- 💧 **Opacity Control** - 8-digit hex codes with alpha channel (RRGGBBAA)
- 😀 **Native Emoji** - Full emoji support with proper rendering
- 📥 **SVG Download** - Download banners directly from the UI
- ⚡ **Lightning Fast** - Built with Hono framework for optimal performance
- 🔒 **Secure** - Input sanitization and validation
- 🚀 **Edge-Ready** - Deploy to modern platforms like Railway

## 🚀 Quick Start

### Use the Hosted Service

Visit [ghrb.waren.build](https://ghrb.waren.build) to create your banner using the interactive UI.

### Self-Hosting

```bash
git clone https://github.com/warengonzaga/github-repo-banner.git
cd github-repo-banner
pnpm install
pnpm dev
```

### Deploy to Railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT&utm_medium=integration&utm_source=template&utm_campaign=generic)

When you deploy your own copy, you're directly supporting this project! 💖

## 📖 Usage Examples

### Gradient Background

```text
https://ghrb.waren.build/banner?header=My+Project&bg=ec4899-3b82f6&color=ffffff
```

![Gradient Example](https://ghrb.waren.build/banner?header=My+Project&bg=ec4899-3b82f6&color=ffffff)

### Solid Color with Subheader

```text
https://ghrb.waren.build/banner?header=OSSPH&subheader=Open+Source+Community&bg=dbeafe&color=3b82f6
```

![Solid Color Example](https://ghrb.waren.build/banner?header=OSSPH&subheader=Open+Source+Community&bg=dbeafe&color=3b82f6)

### With Emojis

```text
https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&support=true
```

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

### Transparent Background

```text
https://ghrb.waren.build/banner?header=Transparent&bg=00000000&color=ffffff
```

![Transparent Example](https://ghrb.waren.build/banner?header=Transparent&bg=00000000&color=ffffff)

### With Opacity

```text
https://ghrb.waren.build/banner?header=Semi-Transparent&bg=ffffff80&color=000000
```

![Opacity Example](https://ghrb.waren.build/banner?header=Semi-Transparent&bg=ffffff80&color=000000)

## 🔌 API Reference

### `GET /banner`

Generate a custom SVG banner.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `header` | string | No | "Hello World" | Main text (supports emojis) |
| `subheader` | string | No | - | Optional subtitle text |
| `bg` | string | No | `1a1a1a-4a4a4a` | Background color in hex format |
| `color` | string | No | `ffffff` | Header text color (hex without #) |
| `subheadercolor` | string | No | Same as `color` | Subheader text color |
| `support` | boolean | No | `false` | Show support watermark |

#### Background Format

| Format | Example | Description |
|--------|---------|-------------|
| Gradient | `HEX1-HEX2` | `1a1a1a-4a4a4a` (left to right) |
| Solid | `HEX` | `ffffff` (single color) |
| Transparent | `00000000` | Fully transparent |
| With Opacity | `RRGGBBAA` | `ffffff80` (50% opacity) |

#### Response

- **Content-Type**: `image/svg+xml`
- **Cache-Control**: `public, max-age=86400` (production)
- **Size**: 1280×304px

### `GET /`

Interactive banner generator UI with live preview.

### `GET /health`

Health check endpoint for monitoring.

```json
{ "status": "ok", "timestamp": "2026-02-01T00:00:00.000Z" }
```

## 🎨 Color Presets

The UI includes presets for quick access:

**Gradients**: `1a1a1a-4a4a4a` (Midnight) • `ec4899-3b82f6` (Vibe) • `14b8a6-06b6d4` (Ocean)

**Solids**: `dbeafe`/`3b82f6` (Sky) • `fee2e2`/`bb2c2c` (Molty) • `fde8e3`/`de7356` (Claude) • `f3f4f6`/`1f2937` (Minimal)

**Special**: `00000000`/`ffffff` (Transparent)

> **Tip:** Create any custom gradient or color using hex codes directly in the URL.

## 🛠️ Development

### Tech Stack

**Runtime**: Node.js • **Framework**: [Hono](https://hono.dev/) • **Language**: TypeScript • **Build**: tsup • **Package Manager**: pnpm

### Commands

```bash
pnpm dev      # Development with hot-reload
pnpm build    # Production build
pnpm start    # Start production server
```

### Environment Variables

```env
PORT=3000              # Server port
NODE_ENV=development   # Environment mode
```

### Security

✅ Input sanitization (XSS prevention)
✅ Hex color validation
✅ Header length limits
✅ No external dependencies

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

<div align="center">

💖 **[Support this project](https://github.com/sponsors/warengonzaga)** • Give it a ⭐ on **[GitHub](https://github.com/warengonzaga/github-repo-banner)**!

Built with [Hono](https://hono.dev/) • Part of [WG Technology Labs](https://github.com/wgtechlabs)

</div>

