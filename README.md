# GitHub Repo Banner

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=GitHub+Repo+Banner+%F0%9F%93%A6&subheader=great+projects+deserve+great+presentation+%F0%9F%92%96&bg=f3f4f6&color=1f2937&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

I believe every repository deserves to look beautiful. Your code is art, your projects deserve stunning visuals to match. But design tools steal hours you don't have. So I built a service that generates gorgeous banners through simple URL parameters. Instant, customizable, and no design tools required. Because great projects deserve great presentation.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT&utm_medium=integration&utm_source=template&utm_campaign=generic)

## Features

- 🎨 **Dynamic Banner Generation** - Create custom banners on-the-fly via URL parameters
- 🌈 **Gradient Support** - Create custom gradients using hex codes (e.g., `bg=HEX1-HEX2`)
- 🎯 **Full Color Control** - Use hex codes for background and text colors
- 💧 **Opacity Support** - 8-digit hex codes with alpha channel (e.g., `FFFFFF80`)
- 😀 **Emoji Support** - Native emoji rendering in banners
- 📥 **Download SVG** - Download banners directly from the UI
- ⚡ **Fast & Lightweight** - Built with Hono for optimal performance
- 🔒 **Input Sanitization** - Secure text processing and validation
- 📦 **Zero Dependencies** - Minimal production footprint
- 🚀 **Edge-Ready** - Deployable to modern edge platforms

## Installation

```bash
# Clone the repository
git clone https://github.com/warengonzaga/github-repo-banner.git
cd github-repo-banner

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Usage

### Basic Example

```text
https://ghrb.waren.build/banner?header=Hello+World+%F0%9F%91%8B&bg=1a1a1a-4a4a4a&color=ffffff&support=true
```

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=Hello+World+%F0%9F%91%8B&bg=1a1a1a-4a4a4a&color=ffffff&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

### Gradient Background

```text
https://ghrb.waren.build/banner?header=My%20Project&bg=ec4899-3b82f6&color=ffffff
```

![Background Preset Banner](https://ghrb.waren.build/banner?header=My%20Project&bg=ec4899-3b82f6&color=ffffff)

### Solid Color Background

```text
https://ghrb.waren.build/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=dbeafe&color=3b82f6&support=true
```

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=dbeafe&color=3b82f6&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

### With Emojis

```text
https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.+Any+OS.+Any+Platform.&bg=fee2e2&color=bb2c2c&support=true
```

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.+Any+OS.+Any+Platform.&bg=fee2e2&color=bb2c2c&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

### Transparent Background

```text
https://ghrb.waren.build/banner?header=Hi%2C+I%27m+Waren+%F0%9F%91%8B&bg=00000000&color=ffffff&support=true
```

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=Hi%2C+I%27m+Waren+%F0%9F%91%8B&bg=00000000&color=ffffff&support=true)<!-- Created with GitHub Repo Banner by Waren Gonzaga: https://ghrb.waren.build -->

### With Opacity

```text
https://ghrb.waren.build/banner?header=Semi-Transparent&bg=ffffff80&color=000000
```

![GitHub Repo Banner](https://ghrb.waren.build/banner?header=Semi-Transparent&bg=ffffff80&color=000000)

## API Reference

### GET `/banner`

Generate a custom SVG banner.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `header` | string | "Hello World" | Banner text (supports emojis) |
| `subheader` | string | - | Optional subheader text |
| `bg` | string | "1a1a1a-4a4a4a" | Background hex color. Gradient: `HEX1-HEX2`, Solid: `HEX`, Transparent: `00000000` |
| `color` | string | "ffffff" | Text color (hex without #, supports 8-digit with opacity) |
| `subheadercolor` | string | (same as `color`) | Subheader text color (hex without #) |
| `support` | boolean | false | Show watermark to support the project |

**Background Format:**
- **Gradient**: Two hex codes separated by hyphen (e.g., `1a1a1a-4a4a4a`)
- **Solid**: Single hex code (e.g., `ffffff`)
- **Transparent**: `00000000` (8-digit hex with zero opacity)
- **With Opacity**: 8-digit hex codes (e.g., `ffffff80` for 50% opacity)

**Response:**
- Content-Type: `image/svg+xml`
- Cache-Control: `public, max-age=86400` (production) or `no-cache` (development)

### GET `/`

Interactive UI for banner customization and preview.

### GET `/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T00:00:00.000Z"
}
```

## Preset Examples

The UI includes preset buttons for quick access to popular color schemes:

### Gradients

| Name | Hex Codes | Example |
|------|-----------|----------|
| Midnight | `1a1a1a-4a4a4a` | Dark gray gradient |
| Vibe | `ec4899-3b82f6` | Pink to blue gradient |
| Ocean | `14b8a6-06b6d4` | Teal to cyan gradient |

### Solid Colors

| Name | Hex Code | Description |
|------|----------|-------------|
| Sky | `dbeafe` / `3b82f6` | Light blue background with dark blue text |
| Molty | `fee2e2` / `bb2c2c` | Light salmon background with dark red text |
| Claude | `fde8e3` / `de7356` | Light peach background with rust text |
| Minimal | `f3f4f6` / `1f2937` | Light gray background with dark gray text |
| Transparent | `00000000` / `ffffff` | Fully transparent with white text |

**Note:** You can create any gradient or color combination using hex codes directly in the URL.

## Development

### Project Structure

```
github-repo-banner/
├── src/
│   ├── index.ts              # Server entry point
│   ├── banner/
│   │   ├── backgrounds.ts    # Background preset definitions
│   │   ├── emoji.ts          # Emoji processing utilities
│   │   ├── svg-template.ts   # SVG generation logic
│   │   └── types.ts          # TypeScript type definitions
│   ├── routes/
│   │   ├── banner.ts         # Banner generation endpoint
│   │   └── ui.ts             # Web UI endpoint
│   ├── ui/
│   │   └── index.html        # Interactive UI
│   └── utils/
│       └── sanitize.ts       # Input validation & sanitization
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Tech Stack

- **Runtime**: Node.js
- **Framework**: [Hono](https://hono.dev/) - Ultrafast web framework
- **Language**: TypeScript
- **Build Tool**: tsup
- **Package Manager**: pnpm

### Scripts

```bash
# Development with hot-reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode (affects caching) |

## Security

- Input sanitization prevents XSS attacks
- Hex color validation ensures safe rendering
- Header length limits prevent abuse
- No external dependencies in runtime

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (follow [Clean Commit](https://github.com/wgtechlabs/clean-commit) convention)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Self Host

Want to run your own instance? Deploy to Railway with one click:

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/github-repo-banner?referralCode=KN9JqT&utm_medium=integration&utm_source=template&utm_campaign=generic)

When you deploy your own copy, you're directly supporting this project! 💖

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Waren Gonzaga**

- GitHub: [@warengonzaga](https://github.com/warengonzaga)
- Website: [warengonzaga.com](https://warengonzaga.com)

## Acknowledgments

- Built with [Hono](https://hono.dev/)
- Inspired by dynamic badge generation services
- Part of the WG Technology Labs ecosystem

---

💖 Support this project by giving it a ⭐ on [GitHub](https://github.com/warengonzaga/github-repo-banner)!
