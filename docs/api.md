# API Reference

[Back to README](../README.md) · [Self-hosting](self-hosting.md)

## `GET /banner`

Generate a custom SVG banner.

### Parameters

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

### Background Effects

Non-finite, non-numeric, and out-of-range values use the parameter defaults. Effects apply in this order: blur, brightness, contrast, saturation, then grayscale. Color filters work on solid colors, gradients, and images while preserving transparency; blur requires a successfully loaded image. Foreground text, icons, and watermarks stay unchanged. Neutral settings preserve existing output and are omitted from UI-generated URLs. Effects are embedded as native SVG filters for preview and SVG/PNG export.

### Background Format

| Format | Example | Description |
|--------|---------|-------------|
| Gradient | `1a1a1a-4a4a4a` | Two hex colors separated by `-`, left to right |
| Solid | `ffffff` | Single hex color |
| Transparent | `00000000` | Fully transparent |
| With Opacity | `ffffff80` | `RRGGBBAA` (about 50% opacity) |
| Image URL | `bgimg=https://...` | Public HTTPS raster image (fetched and embedded as base64) |

### Response

- **Content-Type**: `image/svg+xml`
- **Cache-Control**: `public, max-age=86400, s-maxage=86400` (production)
- **Size**: 1280×304px

## `GET /`

Interactive banner generator UI with live preview.

## `GET /api/pexels/search`

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

The image URLs above are illustrative. Request the next page while `hasMore` is true; an empty page ends pagination. Missing server configuration returns HTTP 503, exhausted local capacity/budget returns 429 with `Retry-After: 60`, and upstream failures return 500. See [Resource limits](self-hosting.md#resource-limits).

## `GET /health`

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

## `GET /stats`

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

See [Privacy & Transparency](../README.md#-privacy--transparency) for definitions, exclusions, retention, opt-out, and legacy-data migration.

## Usage Examples

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

### Custom Background Image

```text
https://ghrb.waren.build/banner?header=My+Project&bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg&color=ffffff
```

Use a direct public HTTPS URL serving JPEG, PNG, GIF, WebP, or AVIF, up to 10 MiB. URLs containing credentials, blocked private addresses, redirects, and SVG images are not supported. The server embeds the image as base64 and scales it to cover the banner. An invalid URL uses the `bg` selection; an accepted URL whose download fails uses the default gradient.

When the UI accepts an image URL, it disables background colors and presets while preserving their values. Clear the image URL to use those settings again.

## Color Presets

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
