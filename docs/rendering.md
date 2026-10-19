# Banner Rendering

[Back to README](../README.md) · [Public pages](pages.md) · [API reference](api.md) · [Self-hosting](self-hosting.md)

## Banner renderer

The banner renderer at `/render/banner` generates a custom SVG banner.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `header` | string | No | "Hello World" | Main text (supports emojis and icons) |
| `subheader` | string | No | - | Optional subtitle text, with the same icon syntax as `header` |
| `images` | JSON string | No | `[]` | Positioned custom images; see [custom image settings](#custom-icons-and-positioned-images) |
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
| `stats` | boolean | No | `true` | On instances with optional tracking, `false` excludes this request. Do Not Track and Global Privacy Control also opt out. |
| `watermarkpos` | string | No | `bottom-right` | Watermark position: `top-left`, `top-right`, `bottom-left`, `bottom-right` |

Header and subheader display text are limited to 50 and 60 JavaScript string units respectively, with at most five inline icons per field. Complete icon tokens do not count toward the display-text limit. Raw input is capped at 500 units, or 2,048 units when it contains custom icon syntax. Font names are sanitized and limited to 50 units. Encode query values, especially embedded image URLs containing their own `&` or `#`; `URLSearchParams` handles this when building URLs in code.

### Custom Icons and Positioned Images

Use inline custom icons in `header` or `subheader`:

```text
![icon src="https://example.com/logo.png" w="100%"] My Project
```

Attributes use double quotes. `src` is required; `w` and `h` are optional and each accepts `1–304px` or `1–200%`. Percentages are relative to the surrounding rendered font size, not the banner. Omitting both sizes uses the text height; specifying one preserves the image's aspect ratio. With both, the image fits inside the requested box while preserving proportions. Available line space limits oversized icons. Existing Simple Icons syntax (`![github]`, `![github](light)`) and emoji remain supported. Custom icons do not accept X/Y positions or rotation; use positioned images for these controls.

For independent images, supply `images` as one JSON-encoded array, at most 4,096 JavaScript string units before URL encoding. Each object accepts only these fields:

| Field | Default | Accepted value |
|-------|---------|----------------|
| `src` | Required | Direct public HTTPS image URL, at most 512 units |
| `x` | `0` | Number from 0 to 1280 pixels from the left edge |
| `y` | `0` | Number from 0 to 304 pixels from the top edge |
| `w` | `128` | Width from 1 to 1280 pixels |
| `h` | `128` | Height from 1 to 304 pixels |
| `rotation` | `0` | Finite number from 0 to 360 degrees clockwise around the image box’s center; decimals are accepted |
| `fit` | `contain` | `contain` preserves proportions inside the box; `stretch` fills it |
| `placement` | `behind` | `behind` or `front`, relative to text |

The canvas is 1280×304 pixels; portions outside it, including rotated corners, are cropped. X/Y and width/height define the unrotated box. Rotation uses its center `(x + w/2, y + h/2)` without changing those values. Omitted or zero rotation preserves existing designs; 360° is a full turn. Invalid rotation values return HTTP 400. Images render above the background, in array order from back to front within each placement group. The watermark remains above all images. Background filters do not affect custom icons or positioned images.

This example builds a URL without manually escaping nested quotes or image URL parameters. The image URLs are illustrative; replace them with working direct image URLs.

```js
const query = new URLSearchParams({
  header: '![icon src="https://example.com/logo.png" w="100%"] My Project',
  images: JSON.stringify([
    { src: 'https://example.com/decoration.png', x: 32, y: 32, w: 128, h: 128, rotation: 30, fit: 'contain', placement: 'behind' },
  ]),
});
const bannerUrl = `https://ghrb.waren.build/render/banner?${query}`;
```

There is a shared limit of five custom images across positioned layers and inline icons in both text fields; repeated uses still count. Each custom image must serve JPEG, PNG, GIF, WebP, or AVIF with a matching image content type and a download no larger than 1 MiB. Image data must decode successfully; the limit is 16,777,216 decoded pixels across all frames. SVG, redirects, credentials, and non-public addresses are rejected. The server fetches and embeds image data into the SVG. Malformed settings return HTTP 400; an unavailable, oversized, or unsupported custom image returns HTTP 422 instead of a partial banner. The generator disables exports until the custom-image preview succeeds.

Rotation and the other settings travel through copied URLs/Markdown and SVG/PNG downloads. Exports run in the browser and designs are not saved on the server. Existing designs without `images` keep their prior behavior.

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

Invalid custom-image settings return HTTP 400 with a JSON error. Failed custom-image downloads return HTTP 422 with a JSON error; they do not return an incomplete SVG.

## Usage Examples

**Gradient Background**

```text
https://ghrb.waren.build/render/banner?header=Vibe+Coding%F0%9F%9A%80&bg=ec4899-3b82f6&color=ffffff
```

![Gradient Example](https://ghrb.waren.build/render/banner?header=Vibe+Coding%F0%9F%9A%80&bg=ec4899-3b82f6&color=ffffff)

**Solid Color with Subheader**

```text
https://ghrb.waren.build/render/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=E7F9FF&color=0060A0
```

![Solid Color Example](https://ghrb.waren.build/render/banner?header=OSSPH&subheader=Leading+Open+Source+Software+Community+in+the+Philippines&bg=E7F9FF&color=0060A0)

**With Emojis & Custom Fonts**

```text
https://ghrb.waren.build/render/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&headerfont=Roboto&subheaderfont=Inter&support=true
```

![Emoji Example](https://ghrb.waren.build/render/banner?header=%F0%9F%A6%9EOpenClaw&subheader=Your+own+personal+AI+assistant.&bg=fee2e2&color=bb2c2c&headerfont=Roboto&subheaderfont=Inter&support=true)

**With Brand Icons (Simple Icons)**

```text
https://ghrb.waren.build/render/banner?header=![github]+Hello+World&bg=1a1a1a-4a4a4a&color=ffffff
https://ghrb.waren.build/render/banner?header=![react]+![typescript]+Modern+Stack&bg=14b8a6-06b6d4&color=ffffff
```

![Icon Example](https://ghrb.waren.build/render/banner?header=![github]+Hello+World&bg=1a1a1a-4a4a4a&color=ffffff)

> Use `![slug]` syntax to embed any icon from [Simple Icons](https://simpleicons.org). Over 3000+ brand icons available! Icons automatically adapt to your text color.

**Transparent/Opacity**
  
```text
https://ghrb.waren.build/render/banner?header=Transparent&bg=00000000&color=ffffff
https://ghrb.waren.build/render/banner?header=Semi-Transparent&bg=ffffff80&color=000000
```

### Custom Background Image

```text
https://ghrb.waren.build/render/banner?header=My+Project&bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg&color=ffffff
```

Use a direct public HTTPS URL serving JPEG, PNG, GIF, WebP, or AVIF, up to 10 MiB and 16,777,216 decoded pixels across all frames. The data must decode successfully and match its declared content type. URLs containing credentials, blocked private addresses, redirects, and SVG images are not supported. The server embeds the image as base64 and scales it to cover the banner. An invalid URL uses the `bg` selection; an accepted URL whose download fails uses the default gradient.

When the UI accepts an image URL, it disables background colors and presets while preserving their values. Clear the image URL to use those settings again.

## Color Presets

The UI includes presets for quick access:

### Gradients

| Name | Background | Text Color | Preview |
|------|------------|------------|---------|
| Midnight | `1a1a1a-4a4a4a` | `ffffff` | ![Midnight](https://ghrb.waren.build/render/banner?header=Midnight&bg=1a1a1a-4a4a4a&color=ffffff) |
| Vibe | `ec4899-3b82f6` | `ffffff` | ![Vibe](https://ghrb.waren.build/render/banner?header=Vibe&bg=ec4899-3b82f6&color=ffffff) |
| Ocean | `14b8a6-06b6d4` | `ffffff` | ![Ocean](https://ghrb.waren.build/render/banner?header=Ocean&bg=14b8a6-06b6d4&color=ffffff) |
| Railway | `431586-9231A8` | `ffffff` | ![Railway](https://ghrb.waren.build/render/banner?header=Railway&bg=431586-9231A8&color=ffffff) |
| Cloudflare | `F38020-FBAB41` | `ffffff` | ![Cloudflare](https://ghrb.waren.build/render/banner?header=Cloudflare&bg=F38020-FBAB41&color=ffffff) |
| Waren | `013B84-016EEA` | `ffffff` | ![Waren](https://ghrb.waren.build/render/banner?header=Waren&bg=013B84-016EEA&color=ffffff) |
| OSSPH | `E7F9FF-90C4E8` | `0060A0` | ![OSSPH](https://ghrb.waren.build/render/banner?header=OSSPH&bg=E7F9FF-90C4E8&color=0060A0) |

### Solid Colors

| Name | Background | Text Color | Preview |
|------|------------|------------|---------|
| Sky | `87ceeb` | `1e3a8a` | ![Sky](https://ghrb.waren.build/render/banner?header=Sky&bg=87ceeb&color=1e3a8a) |
| Molty | `fee2e2` | `bb2c2c` | ![Molty](https://ghrb.waren.build/render/banner?header=Molty&bg=fee2e2&color=bb2c2c) |
| Claude | `fde8e3` | `de7356` | ![Claude](https://ghrb.waren.build/render/banner?header=Claude&bg=fde8e3&color=de7356) |
| GPT | `10a37f` | `ffffff` | ![GPT](https://ghrb.waren.build/render/banner?header=GPT&bg=10a37f&color=ffffff) |
| Minimal | `f3f4f6` | `1f2937` | ![Minimal](https://ghrb.waren.build/render/banner?header=Minimal&bg=f3f4f6&color=1f2937) |

### Special

| Name | Background | Text Color | Preview |
|------|------------|------------|---------|
| Transparent | `00000000` | `ffffff` | ![Transparent](https://ghrb.waren.build/render/banner?header=Transparent&bg=00000000&color=ffffff) |

> **Tip:** Create any custom gradient or color using hex codes directly in the URL.
