# Public Pages

[Back to README](../README.md) · [API reference](api.md) · [Self-hosting](self-hosting.md)

These routes return HTML pages for people. They are separate from the JSON endpoints in the [API reference](api.md) and the SVG routes in the [Banner Rendering guide](rendering.md).

## Generator

The home page at `/` provides an interactive banner generator with live preview, browser-side SVG/PNG export, and README Markdown output.

## Docs

The documentation page at `/docs` renders the bundled README, API reference, self-hosting guide, contribution guide, Terms, Privacy Policy, Code of Conduct, and license.

## Usage stats

When `ENABLE_STATS=true`, the generator sidebar shows the current UTC day’s successful banner render count. The section is hidden when tracking is disabled. There is no JSON stats endpoint or stats page. The old `/usage` URL remains as a withdrawal-only page for previously showcased designs; it does not display statistics or accept new submissions.

When stats are enabled, a successful render increments one daily counter after it reaches the server. Add `stats=false` to a banner URL, or send `DNT: 1` or `Sec-GPC: 1`, to exclude that request. The generator shows the per-banner opt-out when its optional watermark is turned off.
