# AGENTS.md

## Git Commit Convention

This project strictly follows the [Clean Commit](https://github.com/wgtechlabs/clean-commit) convention by wgtechlabs.

### Commit Message Format

```
<emoji> <type>: <description>
```

With optional scope:

```
<emoji> <type> (<scope>): <description>
```

### The 9 Commit Types

| Emoji | Type       | Purpose                                            |
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

- Use **lowercase** for type
- Use **present tense** (e.g., "add" not "added")
- **No period** at the end of the description
- Keep description **under 72 characters**
- Scope is optional, but when used keep it short (one word), lowercase, and consistent

### Examples

```
📦 new: user authentication system
🔧 update (api): improve error handling
🗑️ remove: deprecated legacy code
🔒 security: patch XSS vulnerability
⚙️ setup (ci): configure GitHub Actions
☕ chore (deps): bump dependencies
🧪 test: add unit tests for auth
📖 docs: update installation guide
🚀 release: version 1.0.0
```
