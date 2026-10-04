# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [2.2.1] - 2026-10-04

### Security

- reconcile Alpine proposal with distroless (#88)
- reconcile duplicate Trixie runtime proposal (#87)
- reconcile Trixie proposal with distroless (#86)
- reconcile runtime hardening with distroless (#85)
- preserve patched Hono dependency minimum (#84)
- use a nonroot distroless runtime (#82)
- reconcile Debian runtime package refresh (#83)
- patch Hono dependencies and refresh runtime packages (#89)

## [2.2.0] - 2026-09-30

### Added

- add rotation for custom image layers (#80)

## [2.1.0] - 2026-09-30

### Added

- add custom icons and positioned image layers (#78)

## [2.0.0] - 2026-09-29

### Added

- add docs, usage pages and community showcases (#75)

### Changed

- **BREAKING:** require redis for caching and publish docker images (#74)

### Fixed

- address export storage and usage review findings

## [1.4.1] - 2026-09-29

### Changed

- use the built-in token for releases

## [1.4.0] - 2026-09-29

### Added

- add standalone README banner skill
- add background blur and color filter controls
- render repository code of conduct
- display repository license in an accessible tab
- add custom background image support with Pexels integration (#35)

### Changed

- streamline readme and separate reference guides
- align readme with banner features and deployment
- finalize CI and gated release workflow
- restore permanent CI branch filter
- remove temporary branch installation guidance
- restore Pexels feature list marker
- load additional Pexels image search results
- expose stats recording failures and read atomic snapshots
- give mobile document tabs room to breathe
- preserve readable document tab hover colors
- align image validation and avoid repeated announcements
- run checks for the stacked policy PR
- support companion URL controls in regression check
- fail the build gate when validation fails
- adopt Build Flow with a gated release fallback
- remove stale preset badges
- include enabled watermark in preview URLs
- disable colors for image backgrounds
- explain unavailable Pexels image search
- restore supported typescript version
- Bump ioredis from 5.11.1 to 6.0.0 (#44)
- Bump actions/setup-node from 4 to 7 (#49)
- Bump actions/checkout from 4 to 7 (#51)
- Bump wgtechlabs/release-build-flow-action from 1.7.0 to 1.8.0 (#50)
- Bump @types/node from 25.9.6 to 26.5.1 (#48)
- Bump typescript from 6.0.3 to 7.0.2 (#41)
- fix biome formatting in sanitize.ts
- clarify Pexels key behavior
- Bump typescript from 5.9.3 to 6.0.3 (#30)
- Bump @hono/node-server from 1.19.14 to 2.0.4 (#34)
- Bump @types/node from 22.19.19 to 25.9.1 (#33)

### Fixed

- harden background image handling
- add timeout to Pexels requests
- clarify Pexels configuration behavior

### Security

- bound image requests and address promotion review
- pin image fetches to validated DNS addresses

## [1.3.1] - 2026-09-28

### Changed

- update dependencies and add Pexels background image support (#36)
- update CHANGELOG.md for v1.3.0
- sync dependabot configuration (#42)

## [1.3.0] - 2026-05-05

### Added

- centralize icon syntax regex into shared utility
- add icons to sidebar section headers for better visibility
- add logging functionality for user actions and privacy notice
- add character limit validation and feedback for header and subheader inputs
- update header and color input fields for better clarity
- add color picker functionality with preview and input sync
- add info tooltips for header and subheader inputs
- add Simple Icons support with fetching and rendering logic
- add output section with copy and download options for banners
- add @wgtechlabs/log-engine dependency to project
- add dotenv dependency for environment variable management
- add environment variables to .gitignore for sensitive data
- add Waren preset with gradient colors (#13)
- implement privacy-first redis stats tracking (#9)
- add railway and cloudflare presets with new badges (#7)

### Changed

- bump versions of hono and @hono/node-server
- address code review feedback from PR review thread
- add CONTRIBUTING.md with contribute-now CLI and Clean Commit convention (#25)
- bump the npm_and_yarn group across 1 directory with 3 updates (#26)
- add Dependabot configuration (#24)
- add CI and release GitHub Actions workflows (#23)
- bump rollup in the npm_and_yarn group across 1 directory (#21)
- add biome linter and apply import sorting
- add comments and ignore `.contributerc.json`
- bump hono in the npm_and_yarn group across 1 directory (#20)
- unify url generation for copy image url button (#19)
- remove unreachable else branch in icon theme logic (#17)
- enhance font validation and add warning messages
- improve header sanitization by excluding icon syntax from length
- increase icon count limit for header and subheader
- adjust character limit for header and subheader icons
- enhance icon syntax handling in header sanitization
- enhance logging with validation and sanitization
- add Simple Icons support and logging details to README
- adjust tooltip width for better visibility
- silence fallback for missing icons to improve user feedback
- integrate LogEngine for improved logging in Redis functions
- modify watermark logic and checkbox behavior in UI
- fix redis cleanup and non-repo path tracking (#14)

### Security

- fix XSS vulnerability in icon counter by escaping HTML (#15)

