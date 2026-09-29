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
| `stats` | boolean | No | `true` | On self-hosted instances with optional tracking, `false` excludes this request. Official-hosted aggregate counting ignores this opt-out. |
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

## `GET /docs`

Single-page project documentation, rendered from the bundled README, API reference, self-hosting guide, contribution guide, Terms, Privacy notice, code of conduct and license. Chapter links and a responsive table of contents work without JavaScript.

## `GET /usage`

Public usage page that fetches this instance's `/stats` JSON on load and when **Refresh statistics** is selected. Shows current UTC-day page views by page, recorded banner requests, estimated distinct repository identifiers, Referer counts and coverage. Disabled, empty and unavailable states remain distinct. It does not count individual users, verified projects or lifetime adoption. On the official service, it also shows export counts and the community showcase with more previews available through pagination. Only designs explicitly submitted for showcasing appear. `/stats` remains the raw JSON endpoint for integrations.

## `POST /exports`

On the official service, saves every design submitted through a built-in export control and records its usage, regardless of the `showcase` choice. The choice controls only whether a public showcase copy is created. Ordinary self-hosted instances accept count-only requests, respecting `ENABLE_STATS` and query/header opt-outs; they do not collect exported designs.

Mutations require a matching `Origin` header and `Content-Type: application/json`; request bodies are limited to 12 KiB. The `Origin` must match `PUBLIC_ORIGIN`. If unset, official-hosted mode uses `https://ghrb.waren.build`; ordinary self-hosted mode uses the request origin. An HTTPS-terminating proxy, custom official-mode domain or local test needs its exact external origin configured. See [public origin configuration](self-hosting.md#public-origin-and-reverse-proxies).

Every official export request, including `showcase: false`, requires:

- `action`: `markdown`, `url`, `svg`, or `png`.
- `showcase`: an explicit boolean for public display.
- `id`: a client-generated lowercase UUID v4.
- `removalToken`: a cryptographically random 64-character lowercase hexadecimal code for withdrawing a showcase copy.
- `policyVersion`: `2026-09-29`.
- `query`: an object mapping banner parameter names to string values.

Settings use the same sanitization and defaults as `/banner`; no SVG markup or uploaded image binary is accepted. Submit the final exported settings, including watermark omission for the image-URL action. The generator presents the public-sharing choice and constructs this request. Keep the removal token secret and save it before submitting.

A new saved export returns HTTP 201; while a saved or public record exists, an identical retry with the same ID, action, settings, choice and token returns 200 without extending retention, counting again or republishing a withdrawn showcase. A successful response contains `saved: true`, `showcased` (the actual publication result), `id` and `expiresAt` (Unix milliseconds for the saved export's expiry). A public entry also includes `previewUrl`. If the gallery is full, the export still saves and counts, with `showcased: false` and `showcaseReason: "full"`; the download can proceed with that status. An identical retry after withdrawal returns `showcaseReason: "removed"` rather than republishing it.

A withdrawn submission ID cannot be reused after its saved export expires: a stale retry returns `409`. Start a new export for a new submission. Content-free withdrawal markers prevent accidental republication.

Invalid input returns 400, a disallowed origin or content type returns 403, a changed request reusing an existing ID returns 409, and an oversized body returns 413. Storage or publication that cannot be confirmed returns 503. Retry the same request after an uncertain outcome; do not assume it was never saved or published. Saving an export does not prove a later clipboard write or browser download completed. Saved exports have no public retrieval endpoint.

An ordinary self-hosted count-only request sends no design fields:

```json
{ "action": "png", "showcase": false }
```

It returns `{ "showcased": false, "counted": true }` when recording succeeds, or `counted: false` when disabled, opted out or unavailable. This counting is best effort and does not block self-hosted exports during a statistics outage. Public showcasing is unavailable in ordinary self-hosted mode.

## `GET /showcase`

Returns up to 12 newest public showcase entries and a `nextCursor` (`null` when no more remain). Pass a returned cursor as `?before=...` to get older entries. The cursor combines the creation timestamp and entry ID; preserve it as returned and URL-encode it. Each entry contains `id`, `createdAt`, and a same-origin `previewUrl`. The feed excludes non-shared exports. `createdAt` is a Unix timestamp in milliseconds. An instance with showcasing disabled returns `{ "enabled": false, "entries": [], "nextCursor": null }`.

The gallery holds at most 1,000 entries; when full, new official exports still save and count but do not create a showcase copy. Existing entries remain until creator withdrawal or operator removal. Gallery lists, previews and removals do not increment banner or page counters; opening `/usage` still counts as a page response.

## `GET /showcase/:id.svg`

Renders a saved public design using the existing banner renderer. It is a preview from normalized settings, not a permanent pixel snapshot: remote backgrounds and other assets can change or become unavailable. The endpoint does not expose the entry's removal token.

## `DELETE /showcase/:id`

Withdraw a showcase entry by sending JSON containing its private `removalToken`. The same configured-origin and JSON content-type checks as `/exports` apply:

```json
{ "removalToken": "<the 64-character removal code saved at submission>" }
```

A successful removal returns `{ "removed": true }` and deletes the public showcase copy and its gallery listing. It does not delete the separate saved export before its configured expiry. Repeating a removal for an already absent entry also succeeds. An invalid code format returns 400; a code that does not match an existing entry returns 403; unavailable storage returns 503. Copies already downloaded or cached elsewhere cannot be recalled. See the [Privacy notice](privacy.md#showcase-removal) if the code is unavailable or the entry needs to be reported.

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

The image URLs above are illustrative. Request the next page while `hasMore` is true; an empty page ends pagination. Missing Pexels configuration or unavailable Redis returns HTTP 503, exhausted per-process concurrency or shared Redis budget returns 429 with `Retry-After: 60`, and upstream failures return 500. See [Resource limits](self-hosting.md#resource-limits).

## `GET /health`

Readiness endpoint with `Cache-Control: no-store`. Returns HTTP 200 when Redis answers a ping. A disconnected or unresponsive database returns HTTP 503 with `status: "degraded"` and `database.available: false`. The tracking setting does not affect readiness; it is not a guarantee that every write succeeded.

**Response (stats disabled):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-01T00:00:00.000Z",
  "database": { "available": true },
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
  "database": { "available": true },
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
  "pageViews": {
    "generator": 80,
    "documentation": 15,
    "usage": 5,
    "total": 100,
    "firstRecordedAt": "2026-09-29T08:05:00.000Z"
  },
  "exports": {
    "total": 30,
    "showcased": 8,
    "firstRecordedAt": "2026-09-29T08:10:00.000Z"
  },
  "coverage": "partial"
}
```

`pageViews` and `exports` are additive fields in schema version 2. Page views count successful origin GET page responses, not unique visitors; refreshing `/stats` does not increment them. `exports.total` counts accepted export requests; `exports.showcased` counts those that newly publish a design. First-recorded times are separate, and `null` before the first observation of that kind, so a mid-day rollout does not imply full-day coverage. Official-hosted mode saves and counts all accepted exports, including those not showcased; identical retries of saved exports do not count again. Self-hosted count-only exports follow the optional tracking setting and opt-outs. Storage failures and incomplete requests can leave observations unrecorded.

Official-hosted mode always enables aggregate counting; `stats=false`, `DNT: 1`, and `Sec-GPC: 1` only exclude requests on self-hosted instances with optional tracking. A showcase decision never controls counting. See [Privacy & Transparency](../README.md#-privacy--transparency) for definitions, exclusions, retention, self-hosted opt-out, and legacy-data migration.

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
