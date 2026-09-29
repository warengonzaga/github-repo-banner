# Banner service contract

Canonical implementation: `src/routes/banner.ts`, `src/utils/sanitize.ts`, `src/utils/icon-syntax.ts`, `src/banner/svg-template.ts`, and the Markdown builder in `src/ui/index.html` in [github-repo-banner](https://github.com/warengonzaga/github-repo-banner). Maintain this reference when those contracts change. Hosts loading only this folder do not need the repository checkout.

`GET /banner` returns a 1280 × 304 SVG. The default service is `https://ghrb.waren.build`; deployments may differ from the repository. Verify requested capabilities against the selected service. Use only the parameters below unless a newer deployed contract is verified.

| Parameter | Meaning and limits |
| --- | --- |
| `header` | Main text; defaults to Hello World when absent/empty; 50 UTF-16 text units after recognized icon syntax is excluded. |
| `subheader` | Optional subtitle; 60 UTF-16 text units excluding recognized icon syntax. |
| `bg` | Hex without `#`: use 3 or 6 digits, or 8 with alpha. Two hex colors separated by `-` form a gradient. `00000000` is transparent. Default: `1a1a1a-4a4a4a`. |
| `color` | Header foreground hex without `#`; default white. |
| `subheadercolor` | Optional separate subtitle hex; otherwise inherits text color. |
| `bgimg` | Public HTTPS image URL, at most 2048 JavaScript string units, no credentials/private hosts. Valid images take priority over `bg`. |
| `headerfont`, `subheaderfont` | Google Font family names, e.g. `Roboto`. Sanitized to ASCII letters, digits, whitespace and `+`, then limited to 50 units. Use raw spaces with the URL builder. |
| `stats` | `false` opts out of optional usage statistics; otherwise recording depends on deployment settings. |
| `bgblur` | Image-only blur, 0–30px; default 0. |
| `bgbrightness`, `bgcontrast`, `bgsaturation` | Background adjustments, 0–200%; default 100. |
| `bggrayscale` | Background grayscale, 0–100%; default 0. |
| `support` | Only the literal `true` enables the visible watermark; default off. |
| `watermarkpos` | `top-left`, `top-right`, `bottom-left`, `bottom-right` (default). |

Text supports Unicode and emoji. An emoji can consume multiple UTF-16 units; combining sequences can be longer still. The sanitizer strips HTML-like tags, caps each raw stripped field at 500 UTF-16 units, and allows at most five recognized icons per field. Truncation can split a Unicode sequence; avoid the boundary by choosing shorter copy and checking the result. Recognized icons do not count toward the 50/60 text limits but still occupy visual width, so numeric compliance does not guarantee no clipping.

Simple Icons syntax is `![slug]`, optionally followed by `(light)`, `(dark)`, or `(auto)`. Use lowercase slugs containing letters, digits, `_` or `-`, for example `![github]` or `![react](light)`. Verify that a slug exists and is visible on the chosen background. Invalid syntax can become literal text; a missing icon asset need not fail the request. Do not confuse icon syntax inside a query value with the outer README Markdown.

Image fetches are limited to 10 MiB and have a 10-second timeout. Supported response MIME types are JPEG, PNG, GIF, WebP and AVIF; SVG image URLs are not supported. Redirects, unavailable assets, private addresses, and incorrect content types may fail. An invalid image URL falls back to the `bg` selection; a valid URL whose fetch fails falls back to the default gradient. Check embedded image data and the visual result. Fonts can also fall back when fetching fails. Invalid colors fall back to defaults, and an invalid watermark position becomes bottom-right.

Background effects leave foreground text/icons/watermarks unchanged. Invalid or out-of-range effect values use defaults. Blur applies only after an image loads; color filters also support solids and gradients. Neutral values preserve existing output. Verify deployment support before promising a rendered effect. Pexels search and PNG download are UI capabilities, not additional `/banner` query formats.

## Representative checks

Exercise these cases when changing the skill or service; record which checks actually ran:

- Solid `bg=0d1117`, gradient `bg=0d1117-243b55`, transparent `bg=00000000`.
- Unicode/emoji `header=Café 🚀`, and icon `header=![github] My Project`.
- Custom font `headerfont=Roboto`; inspect the font and actual appearance.
- Nested URL `bgimg=https://images.pexels.com/photos/1261728/pexels-photo-1261728.jpeg?w=1280&auto=compress`; assert decoded `bgimg` exactly matches the input.
- Overlong header (51 ASCII units), subtitle (61), emoji at the boundary, and more than five icons: shorten before submitting, not after truncation.
- Invalid color, invalid icon slug, unavailable font, and rejected `https://localhost/image.png`: check fallback rather than treating HTTP 200 as success.
- Draft request: no target-file changes. Authorized edit: replace existing banner, preserve adjacent content, and confirm a repeated edit does not duplicate it.
