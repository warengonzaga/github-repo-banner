# Privacy Policy

[Back to README](../README.md) · [Terms of Service](terms.md)

This notice describes the optional usage stats and external services used by GitHub Repo Banner. Self-hosted operators control their own deployments, hosting logs, and privacy policies.

## Optional usage stats

Usage stats are disabled by default. When `ENABLE_STATS=true`, the app counts successful banner renders by UTC day. Daily counters expire seven days after their last write. The public `/stats` page shows the current day’s count.

The count is an aggregate request total. It does not identify people or unique views, and may include previews, bots, and retries. Responses served from a browser or CDN cache do not reach the app and are not counted. A banner request can opt out with `stats=false`, `DNT: 1`, or `Sec-GPC: 1`. The generator shows the per-banner opt-out when its optional watermark is turned off.

The app does not store copied or downloaded designs. Banner parameters are part of the requested URL and are processed to render the image. Avoid putting secrets or sensitive personal information in a banner URL.

## External services and infrastructure

Pexels search uses the configured server-side API key; searches are proxied by `/api/pexels/search` so the key is not sent to browsers. Rendering may contact external font, icon, emoji, or image services. Hosting providers and reverse proxies may keep their own access logs. Operators are responsible for those services and their retention settings.

Redis is required for search caching and quotas even when usage stats are disabled. These operational records are separate from usage stats.

For page routes, see the [public pages guide](pages.md). For banner URLs, see the [Banner Rendering guide](rendering.md). For JSON endpoints and deployment settings, see the [API reference](api.md) and [self-hosting guide](self-hosting.md). For questions, use [project issues](https://github.com/warengonzaga/github-repo-banner/issues).
