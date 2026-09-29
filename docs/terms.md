# Terms of Use

[Back to README](../README.md) · [Privacy notice](privacy.md)

Policy version: **2026-09-29**

These terms describe use of the official GitHub Repo Banner service at [ghrb.waren.build](https://ghrb.waren.build), maintained by Waren Gonzaga. Self-hosted services are operated separately and may have different settings and policies.

## Usage counting and saved exports

The official service records aggregate usage and saves the normalized design settings submitted through its built-in copy and download controls. This applies to every official export, whether or not you choose to showcase it. The showcase prompt controls public gallery display only; it does not turn counting or saving on or off.

Saved exports expire after the operator-configured retention period, which official mode requires before startup. The `EXPORT_RETENTION_DAYS` setting accepts 1 to 365 days and has no default. The deployed service must disclose its selected period. The [Privacy notice](privacy.md) describes these records, aggregate metrics and separate showcase copies.

The official service does not use `stats=false`, `DNT: 1`, or `Sec-GPC: 1` to disable counting or export saving. Ordinary self-hosted instances offer optional counting without collecting exported designs.

## Optional community showcase

When an export control asks whether to showcase a design, choosing to share permits a separate public showcase copy and preview on the Usage page. Choosing not to share still saves the exported design and counts usage, but does not add it to the public gallery.

Only use content you are entitled to use and share, including text, icons, photographs and other assets. Do not include passwords, access tokens, sensitive personal information or material that violates others' rights. Public previews may be viewed, copied and downloaded by other people. Follow the project's [Code of conduct](../CODE_OF_CONDUCT.md).

You retain any rights you hold in your design. Saving an export or showcasing it does not transfer ownership or automatically place it under the software's MIT license. The project being open source does not make every input a public gallery submission. Banner URLs are accessible to anyone who has them, independently of the showcase choice.

## Showcase removal and availability

Save the removal code or removal link provided for a showcase submission. The browser may keep the code locally for convenience, but clearing browser storage can remove that copy. Treat the code as a secret: anyone with it can withdraw that showcase entry.

Public showcase copies remain until withdrawn or removed by the operator, independently of the saved export's expiry. Withdrawal removes the public copy and gallery listing. It does **not** erase the saved export before its retention period ends or recall copies already obtained by others. The service does not promise permanent gallery hosting; entries may be removed for policy violations, rights concerns or service maintenance.

If you cannot use the removal code, contact the maintainer through [project issues](https://github.com/warengonzaga/github-repo-banner/issues) with the entry ID. Do not post removal codes or sensitive content in a public issue.

Previews are rendered from settings, not archived image snapshots. External images, fonts or other assets may change or become unavailable. If the gallery is full, the service still saves the export and counts usage, but explains that the design was not showcased. A storage failure or a service capacity/rate limit can prevent an official export from completing; retrying the same saved export does not extend its retention, count it again or republish a withdrawn showcase.

## Software and service

The repository's source code is provided under the [MIT license](../LICENSE), including its warranty disclaimer. Use the hosted service responsibly and do not attempt to bypass validation, resource limits or access controls. For questions about these terms or to report a showcase entry, use [project issues](https://github.com/warengonzaga/github-repo-banner/issues).
