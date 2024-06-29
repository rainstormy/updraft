# Changelog

This file documents all notable changes to this project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0),
and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Support for Markdown changelogs
  in [Keep a Changelog](https://keepachangelog.com/en/1.1.0) format.
- New option: `--prerelease-files`.
- New option: `--release-files`.

### Changed
- Add a trailing newline character in the output files.
- Changelog files must be named `CHANGELOG.md` or `CHANGELOG.adoc`. Support for
  other filenames has been deprecated and will be removed in the next major
  release.
- Normalise blank lines in changelogs.

## [1.0.0] - 2023-12-08
### Added
- [MIT license](https://choosealicense.com/licenses/mit).
- A Node.js-based entrypoint for the command-line interface named `updraft`.
- New option: `--files`.
- New option: `--help`.
- New option: `--release-version`.
- New option: `--version`.
- Support for AsciiDoc changelogs
  in [Keep a Changelog](https://keepachangelog.com/en/1.1.0) format.
- Support for package.json files.

[unreleased]: https://github.com/rainstormy/updraft/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/rainstormy/updraft/releases/tag/v1.0.0
