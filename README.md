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
- 📥 **SVG & PNG Download** - Download banners as SVG or PNG directly from the UI
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

## 📖 Usage Examples

### Basic Examples

**Gradient Background**

```text
https://ghrb.waren.build/banner?header=Vibe+Coding%F0%9F%9A%80&bg=ec4899-3b82f6&color=ffffff
```

![Gradient Example](https://ghrb.waren.build/banner?header=Vibe+Coding%F0%9F%9A%80&bg=ec4899-3b82f6&color=ffffff)

**Solid Color with Subheader**

```text
https://ghrb.waren.build/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=E7F9FF-90C4E8&color=0060A0
```

![Solid Color Example](https://ghrb.waren.build/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=E7F9FF-90C4E8&color=0060A0)

**With Emojis & Custom Fonts**

```text
https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&support=true
```

![Emoji Example](https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&support=true)

**Transparent/Opacity**
  
```text
https://ghrb.waren.build/banner?header=Transparent&bg=00000000&color=ffffff
https://ghrb.waren.build/banner?header=Semi-Transparent&bg=ffffff80&color=000000
```

## 🌟 Who Uses This

Projects and organizations using GitHub Repo Banner:

- [gogcli](https://github.com/steipete/gogcli) by [steipete](https://github.com/steipete) - Google in your terminal
- [BetterGov PH](https://github.com/bettergovph/bettergov) - Making government services better for Filipinos

## 🔒 Privacy & Transparency

**Privacy by default.** This service does **NOT** track anything by default. If you're using the hosted version at `ghrb.waren.build`, stats tracking status is available at `/health`.

### What We Track (When Enabled)
- ✅ **Repository names only** - GitHub repository URLs from browser Referer headers
- ✅ **Public data only** - Already publicly visible on GitHub

### What We DON'T Track
- ❌ No IP addresses
- ❌ No personal information  
- ❌ No user identities
- ❌ No analytics or behavioral data
- ❌ No cookies or tracking pixels
- ❌ No timestamps or usage patterns

### Why Track (When Enabled)
Understanding which repositories use this service helps:
- Gauge community value and impact
- Make informed maintenance decisions
- Justify resources for this free service

### Your Data Rights
- **Full transparency**: View tracked data at `/stats` (when enabled)
- **Opt-out**: Self-host with stats disabled (default)
- **Open source**: Review tracking code in this repository

### Self-Hosting Privacy
**Self-hosted instances have stats disabled by default.** To enable (optional):
1. Set `ENABLE_STATS=true` in your `.env`
2. Add Redis service to your Railway project
3. See [Railway Deployment](#-railway-deployment) below

## 🚂 Railway Deployment

### Basic Deployment (Stats Disabled - Default)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT)

No additional configuration needed. The service runs without stats tracking.

### With Stats Tracking (Optional)

If you want to track which repositories use your instance:

1. **Deploy the service** using the button above
2. **Add Redis service** in Railway dashboard:
   - Click "New" → "Database" → "Add Redis"
   - Railway automatically sets `REDIS_URL`
3. **Enable stats** in your service variables:
   - Go to your service settings
   - Add variable: `ENABLE_STATS=true`
4. **Redeploy** your service

**Accessing Stats:**
- View at: `https://your-service.railway.app/stats`
- Health check includes stats status: `https://your-service.railway.app/health`

**Cost Note:** Redis on Railway has a free tier, then usage-based pricing. Stats tracking is lightweight and should stay within free limits for moderate traffic.

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
| `headerfont` | string | No | - | Google Fonts family name for header (e.g., "Roboto") |
| `subheaderfont` | string | No | - | Google Fonts family name for subheader (e.g., "Playfair Display") |
| `support` | boolean | No | `false` | Show support watermark |
| `watermarkpos` | string | No | `bottom-right` | Watermark position: `top-left`, `top-right`, `bottom-left`, `bottom-right` |

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

View repository tracking statistics (when enabled).

**Response (stats disabled):**
```json
{
  "enabled": false,
  "message": "Stats tracking is disabled"
}
```

**Response (stats enabled):**
```json
{
  "enabled": true,
  "totalRepositories": 42,
  "repositories": ["owner/repo1", "owner/repo2"],
  "note": "Only tracking public GitHub repositories using this service"
}
```

## 🎨 Color Presets

The UI includes presets for quick access:

**Gradients**: `1a1a1a-4a4a4a` (Midnight) • `ec4899-3b82f6` (Vibe) • `14b8a6-06b6d4` (Ocean) • `431586-9231A8` (Railway) 🆕 • `F38020-FBAB41` (Cloudflare) 🆕 • `E7F9FF-90C4E8` (OSSPH)

**Solids**: `fee2e2`/`bb2c2c` (Molty) • `fde8e3`/`de7356` (Claude) • `10a37f`/`ffffff` (GPT) • `f3f4f6`/`1f2937` (Minimal)

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

# Stats Tracking (disabled by default - privacy-first)
ENABLE_STATS=false     # Set to 'true' to enable repository tracking
REDIS_URL=             # Required only if ENABLE_STATS=true
```

See `.example.env` for complete documentation.

### Security

- Input sanitization (XSS prevention)
- Hex color validation
- Header length limits
- No external dependencies

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
