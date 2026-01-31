# Copilot Instructions

## Git Commit Convention

You must strictly follow the [Clean Commit](https://github.com/wgtechlabs/clean-commit) convention when writing git commit messages. Do not use Conventional Commits, Angular convention, or any other format.

### Format

```
<emoji> <type>: <description>
```

With optional scope:

```
<emoji> <type> (<scope>): <description>
```

### Allowed Types

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
- Use **present tense** — write "add" not "added", "fix" not "fixed"
- **No period** at the end of the description
- Keep description **under 72 characters**
- Always include the emoji prefix that matches the type
- Scope is optional — when used, keep it short (one word), lowercase, and consistent across the project

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

### Common Mistakes to Avoid

- Do not use `feat`, `fix`, `refactor`, `perf`, `ci`, `build`, or any Conventional Commits types
- Do not omit the emoji prefix
- Do not capitalize the type or description
- Do not end the description with a period
- Do not use past tense
