# Contributing to GitHub Repo Banner

Thank you for your interest in contributing! Every contribution helps make this project better. 🎉

## 🚀 Quick Start with contribute-now

This project recommends using [**contribute-now**](https://github.com/warengonzaga/contribute-now) — a developer CLI that automates git workflows so you can focus on shipping, not on memorizing git commands.

### Setup

```bash
bunx contribute-now setup
```

Or install globally:

```bash
bun install -g contribute-now
contribute setup
```

> **Note:** `contribute-now` runs on Bun at runtime. Install [Bun](https://bun.sh) first if you don't have it.

Once set up, use `contribute` (or the short alias `cn`) to handle branching, syncing, staging, committing, and opening PRs automatically.

## 🔧 Manual Workflow

If you prefer the manual approach:

1. **Fork** the repository
2. **Clone** your fork and install dependencies:
   ```bash
   git clone https://github.com/<your-username>/github-repo-banner.git
   cd github-repo-banner
   pnpm install
   ```
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit using the [Clean Commit](#-commit-convention) convention
5. **Push** your branch and **open a Pull Request**

## 📝 Commit Convention

This project strictly follows the [**Clean Commit**](https://github.com/wgtechlabs/clean-commit) convention by WGTech Labs.

### Format

```
<emoji> <type>: <description>
```

With optional scope:

```
<emoji> <type> (<scope>): <description>
```

### Commit Types

| Emoji | Type       | When to use                                        |
|:-----:|------------|----------------------------------------------------|
| 📦    | `new`      | Adding new features, files, or capabilities        |
| 🔧    | `update`   | Changing existing code, refactoring, improvements  |
| 🗑️    | `remove`   | Removing code, files, features, or dependencies    |
| 🔒    | `security` | Security fixes, patches, vulnerability resolutions |
| ⚙️    | `setup`    | Project configs, CI/CD, tooling, build systems     |
| ☕    | `chore`    | Maintenance tasks, dependency updates, housekeeping|
| 🧪    | `test`     | Adding, updating, or fixing tests                  |
| 📖    | `docs`     | Documentation changes and updates                  |
| 🚀    | `release`  | Version releases and release preparation           |

### Rules

- Use **lowercase** for type — never capitalize it
- Use **present tense** — write "add" not "added"
- **No period** at the end of the description
- Keep description **under 72 characters**
- Scope is optional — when used, keep it short (one word) and lowercase

### Examples

```
📦 new: simple icons support for banner headers
🔧 update (api): improve hex color validation
🗑️ remove: deprecated banner endpoint
🔒 security: patch XSS in query parameter handling
⚙️ setup (ci): add GitHub Actions workflow
☕ chore (deps): bump hono to latest version
🧪 test: add unit tests for banner generation
📖 docs: update API reference with new parameters
🚀 release: version 2.0.0
```

> **Tip:** `contribute-now` natively supports and enforces the Clean Commit convention — just use `cn commit` or `cn push` and it guides you through the right format automatically.

## 🛠️ Development

```bash
pnpm dev      # Start development server with hot-reload
pnpm build    # Production build
pnpm start    # Start production server
```

## 🐛 Reporting Issues

Before opening an issue, please check if one already exists. When reporting a bug, include:

- A clear description of the problem
- Steps to reproduce it
- Expected vs actual behavior
- Relevant environment details (OS, Node version, etc.)

For major changes, open an issue first to discuss what you'd like to change.

## 📄 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md). We are committed to providing a welcoming and inclusive environment for everyone.

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com/) | [YHWH](https://www.youtube.com/watch?v=VOZbswniA-g) 🙏
