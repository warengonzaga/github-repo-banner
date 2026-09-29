# Privacy Notice

[Back to README](../README.md) · [Terms of Use](terms.md)

Policy version: **2026-09-29**

This notice describes the official [GitHub Repo Banner service](https://ghrb.waren.build), maintained by Waren Gonzaga. It distinguishes required aggregate counting and saved exported designs from the optional public community showcase. Self-hosted operators control their own deployment and infrastructure logs.

## Aggregate usage

The official service counts successful origin banner and page responses and accepted built-in exports to report service activity. The public Usage page shows current UTC-day observations, not individual users or verified project adoption. Caches, bots, retries, outages and missing Referer headers affect the totals. The metrics do not promise to include every possible download or clipboard action, and accepting an export does not prove the browser completed its copy or download.

Aggregate measurement stores daily counters for banners, each page and exports, plus a Redis HyperLogLog sketch of SHA-256-hashed repository identifiers from valid GitHub Referer paths. These metrics do not contain raw repository names, full Referers, banner content, IP addresses, cookies, sessions or visitor identifiers. Repository estimates do not establish that a repository exists or is public. Exported design records, described below, are separate from these counters.

Daily metric keys expire **seven days after their last write**. Counting and export saving are required on the official service, including when a user declines showcasing. `stats=false`, `DNT: 1`, and `Sec-GPC: 1` do not disable them. These counting opt-outs remain available for ordinary self-hosted instances, which do not collect exported designs.

## Saved exported designs

Every official built-in copy or download request saves the normalized design settings needed to render that export, its action and showcase choice, a random entry ID, timestamps, the policy version, and a hash of its removal code. Settings can include banner text, styling and a background image URL. The service retains these as records of exported designs; they have no public retrieval endpoint. The showcase confirmation controls only whether a separate copy appears publicly, not whether the export is saved or counted.

Saved exports expire after the operator-configured **`EXPORT_RETENTION_DAYS`** period. Official mode requires an explicit value from **1 to 365 days**, with no default; the deployed service must disclose its chosen period. Identical retries do not extend that expiry. Withdrawing a public showcase does not remove the saved export before its retention period ends.

The normal renderer also processes design settings to generate banners. Banner URLs contain those settings and are accessible to anyone who has the URL. Do not include secrets or sensitive personal information. Using an open-source project or rendering a banner does not itself submit a design to the public gallery.

## Public showcase copies

Explicitly choosing to showcase permits a separate copy of the saved design to be rendered publicly on the Usage page. Declining keeps the saved export out of this gallery. The public feed returns the entry ID, creation time and preview URL; it does not return settings or removal codes. The preview exposes the design's visible content, and external assets may change or become unavailable.

Public copies are kept until the creator withdraws them or the operator removes them, independently of the saved export's expiry. Permanent hosting is not promised. When the gallery is full, the export still saves and counts, but the response and interface explain that it was not publicly showcased.

## Showcase removal

Save the removal code or removal link provided when submitting for showcasing. The generator may retain up to 100 removal codes in this browser's local storage for convenience. This is a per-design capability, not a visitor identifier or analytics cookie. It is not synchronized between browsers; clearing local storage removes this convenience copy.

Use the removal link or the Usage page's removal control to withdraw the public copy and its gallery listing. This does **not** delete the saved export before its configured expiry, reduce historical aggregate counts, or erase copies already downloaded or stored by others. An identical export retry does not republish a withdrawn entry. Anyone with the code can remove that showcase entry, so do not publish it.

If you no longer have the code, or need to report someone else's entry, contact the maintainer through [project issues](https://github.com/warengonzaga/github-repo-banner/issues) using the entry ID. Do not post sensitive details or removal codes in a public issue. The operator may need to establish which entry you mean and your relationship to it before acting.

To prevent a withdrawn submission from reappearing through a stale retry, the service keeps a content-free record of its entry ID after removal. This withdrawal marker contains no design or removal code and remains until the operator removes it.

## Operational storage and third parties

Redis is required even when an ordinary self-hosted instance disables tracking. Pexels search responses expire after five minutes; query and API-key cache identifiers are hashed. Quota entries contain timestamps and random identifiers and expire within an hour of the last allowed request. Background images have a short in-process cache; large image binaries are not stored in Redis. Tracking opt-outs do not disable these operational caches or quotas.

Pexels searches and rendering can contact external photo, font, icon, emoji and image services. Hosting providers and reverse proxies may keep access logs independently of application measurement. Operators are responsible for their log and backup settings; this notice does not claim those systems never retain request data. The legacy `/log` endpoint ignores old client payloads.

For metric definitions and API behavior, see [Privacy & Transparency](../README.md#-privacy--transparency) and the [API reference](api.md). For questions about this notice, use [project issues](https://github.com/warengonzaga/github-repo-banner/issues).
