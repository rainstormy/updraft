# Contribution Guidelines

## Tasks
```shell
mise run name_of_task
```

| Task name        | Alias | Description                                                                                                                                                                                      |
|------------------|-------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `build`          | `b`   | Runs `build-cli`, `build-gha`, and `build-lib`.                                                                                                                                                  |
| `build-cli`      | `bc`  | Generates production-grade build artefacts of the command-line entrypoint with [Vite](https://vite.dev).                                                                                         |
| `build-gha`      | `bg`  | Generates production-grade build artefacts of the GitHub Actions entrypoint with [Vite](https://vite.dev).                                                                                       |
| `build-lib`      | `bl`  | Generates production-grade build artefacts of the core library with [Vite](https://vite.dev).                                                                                                    |
| `check`          | `c`   | Runs `check-actions`, `check-format`, and `check-types`.                                                                                                                                         |
| `check-actions`  | `ca`  | Verifies that the GitHub Actions workflows are valid with [actionlint](https://github.com/rhysd/actionlint).                                                                                     |
| `check-format`   | `cf`  | Verifies that the source code is clean and well-formatted with [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html).                |
| `check-renovate` | `cr`  | Verifies that the [Renovate](https://github.com/renovatebot/renovate) configuration file (`.github/renovate.json`) is valid.                                                                     |
| `check-types`    | `ct`  | Verifies that the source code is type-safe with [TypeScript](https://www.typescriptlang.org).                                                                                                    |
| `format`         | `f`   | Applies linting suggestions with [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) and reformats the source code with [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html).               |
| `install`        | `i`   | Installs all third-party dependencies with [mise-en-place](https://mise.jdx.dev) and [pnpm](https://pnpm.io) and (unless opted out) enables the Git hooks with [Lefthook](https://lefthook.dev). |
| `test`           | `t`   | Runs the entire unit test suite once with [Vitest](https://vitest.dev).                                                                                                                          |
| `vitest`         | `v`   | Starts the [Vitest UI](https://vitest.dev/guide/ui.html#vitest-ui) test explorer for continuous unit testing.                                                                                    |
| `yolo`           |       | Disables the Git hooks temporarily with [Lefthook](https://lefthook.dev).                                                                                                                        |                                                                                                              |
