# Changelog

This file documents all notable changes to this project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0),
and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-10-25
### Added
- A Node.js-based GitHub action: `rainstormy/updraft`.
- An ESM export of the program entrypoint with usage instructions and support
  for the `--help` and `--version` options.

### Changed
- The main program entrypoint no longer supports the `--help` and `--version`
  options.

## [1.1.0] - 2024-07-29
### Added
- Support for Markdown changelogs
  in [Keep a Changelog](https://keepachangelog.com/en/1.1.0) format.
- New option: `--check-sequential-release`.
- New option: `--prerelease-files`.
- New option: `--release-files`.
- An ESM export of the main program entrypoint.

### Changed
- Add a trailing newline character in the output files.
- Changelog files must be named `CHANGELOG.md` or `CHANGELOG.adoc`. Support for
  other filenames has been deprecated and will be removed in the next major
  release.
- Normalise blank lines in changelogs.
- `--release-version` accepts any input containing a substring that is a
  semantic version number.

### Fixed
- Disallow leading zeros in semantic version numbers and restrict the set of
  valid prerelease and build identifiers to contain only ASCII alphanumeric
  characters and hyphens.
- Preserve any amount of whitespace between the key and the value of
  the `version` field in `package.json` files.

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

[unreleased]: https://github.com/rainstormy/updraft/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/rainstormy/updraft/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/rainstormy/updraft/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/rainstormy/updraft/releases/tag/v1.0.0
