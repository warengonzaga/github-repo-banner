# Public Pages

[Back to README](../README.md) · [API reference](api.md) · [Self-hosting](self-hosting.md)

These routes return HTML pages for people. They are separate from the JSON endpoints in the [API reference](api.md) and the SVG routes in the [Banner Rendering guide](rendering.md).

## `GET /`

Interactive banner generator with live preview, browser-side SVG/PNG export, and README Markdown output.

## `GET /docs`

Project documentation rendered from the bundled README, API reference, self-hosting guide, contribution guide, Terms, Privacy Policy, Code of Conduct, and license.

## `GET /stats`

Public HTML page showing the current UTC day’s successful banner render count when `ENABLE_STATS=true`. It explains when tracking is disabled or unavailable. There is no JSON stats endpoint.

When stats are enabled, a successful render increments one daily counter after it reaches the server. Add `stats=false` to a banner URL, or send `DNT: 1` or `Sec-GPC: 1`, to exclude that request. The generator shows the per-banner opt-out when its optional watermark is turned off.

## `GET /usage`

Legacy compatibility redirect to `/stats` for existing links. New links should use `/stats`.
