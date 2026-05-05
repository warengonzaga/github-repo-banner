# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


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

