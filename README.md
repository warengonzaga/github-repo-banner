# GitHub Repo Banner

![Banner](https://ghrb.waren.build/banner?header=GitHub+Repo+Banner&bg=gradient-mono)

Generate customizable GitHub repository banners via URL parameters. A lightweight, fast banner generation service built with Hono and TypeScript.

## Features

- 🎨 **Dynamic Banner Generation** - Create custom banners on-the-fly via URL parameters
- 🌈 **Multiple Background Presets** - Choose from gradients and solid colors
- 🎯 **Custom Text Colors** - Override default colors with hex values
- 😀 **Emoji Support** - Native emoji rendering in banners
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
https://ghrb.waren.build/banner?header=My%20Awesome%20Project
```

![Basic Example Banner](https://ghrb.waren.build/banner?header=My%20Awesome%20Project)

### With Background Preset

```text
https://ghrb.waren.build/banner?header=My%20Project&bg=gradient-modern
```

![Background Preset Banner](https://ghrb.waren.build/banner?header=My%20Project&bg=gradient-modern)

### With Custom Color

```text
https://ghrb.waren.build/banner?header=My%20Project&bg=gradient-fresh&color=ffcc00
```

![Custom Color Banner](https://ghrb.waren.build/banner?header=My%20Project&bg=gradient-fresh&color=ffcc00)

### With Emojis

```text
https://ghrb.waren.build/banner?header=🚀%20My%20Project%20✨
```

![Emoji Banner](https://ghrb.waren.build/banner?header=🚀%20My%20Project%20✨)

## API Reference

### GET `/banner`

Generate a custom SVG banner.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `header` | string | "Hello World" | Banner text (supports emojis) |
| `bg` | string | "gradient-mono" | Background preset ID |
| `color` | string | (preset default) | Text color (hex without #) |

**Response:**
- Content-Type: `image/svg+xml`
- Cache-Control: `public, max-age=86400` (production) or `no-cache` (development)

### GET `/`

Interactive UI for banner customization and preview.

## Background Presets

### Gradients

| ID | Name | Colors | Default Text |
|----|------|--------|--------------|
| `gradient-mono` | Monochrome | Dark gray → Medium gray | White |
| `gradient-modern` | Modern | Pink → Blue | White |
| `gradient-fresh` | Fresh | Teal → Cyan | White |

### Solid Colors

| ID | Name | Color | Default Text |
|----|------|-------|--------------|
| `solid-lightblue` | Light Blue | `#dbeafe` | Dark blue |
| `solid-salmon` | Salmon | `#fecaca` | Dark red |
| `solid-lightgray` | Light Gray | `#f3f4f6` | Dark gray |

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
