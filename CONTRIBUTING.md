# Contribution Guidelines

## Quick Start
- [Get started on 🍏 macOS](docs/quick-start/get-started-on-macos.md)
- [Get started on 🟦 Windows + 🐧 WSL](docs/quick-start/get-started-on-wsl.md)

## Tasks
| Name             | Description                                                                                                                                                                   |
|------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `build`          | Generates production-grade build artefacts with [Vite](https://vite.dev).                                                                                                     |
| `build-cli`      | Generates production-grade build artefacts of the command-line entrypoint with [Vite](https://vite.dev).                                                                      |
| `build-gha`      | Generates production-grade build artefacts of the GitHub Actions entrypoint with [Vite](https://vite.dev).                                                                    |
| `build-lib`      | Generates production-grade build artefacts of the core library with [Vite](https://vite.dev).                                                                                 |
| `check`          | Runs `check-actions`, `check-fmt`, and `check-ts`.                                                                                                                            |
| `check-actions`  | Verifies the syntax of the GitHub Actions workflows with [actionlint](https://github.com/rhysd/actionlint).                                                                   |
| `check-fmt`      | Verifies the code style of the source code with [Biome](https://biomejs.dev).                                                                                                 |
| `check-renovate` | Verifies the syntax of the [Renovate](https://github.com/renovatebot/renovate) configuration.                                                                                 |
| `check-ts`       | Verifies the type safety of the source code with [TypeScript](https://www.typescriptlang.org).                                                                                |
| `fmt`            | Reformats the source code with [Biome](https://biomejs.dev).                                                                                                                  |
| `install`        | Installs all third-party dependencies with [mise-en-place](https://mise.jdx.dev) and [pnpm](https://pnpm.io) and enables the Git hooks with [Lefthook](https://lefthook.dev). |
| `test`           | Runs the entire unit test suite once with [Vitest](https://vitest.dev).                                                                                                       |
| `vitest`         | Starts the [Vitest UI](https://vitest.dev/guide/ui.html#vitest-ui) test explorer for continuous unit testing.                                                                 |
| `yolo`           | Disables the Git hooks with [Lefthook](https://lefthook.dev).                                                                                                                 |

## Developer Guides
- [Manage third-party dependencies](docs/guides/manage-third-party-dependencies.md)
