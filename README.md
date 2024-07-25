# Updraft &ndash; Release Automation

Updraft prepares a repository for an upcoming release by updating changelogs and
bumping version numbers in `package.json` files.

It saves the changes to the files, but it does not make any Git commits or
GitHub releases. You can automate these things in your CI/CD pipeline or do them
manually after running the Updraft tool.

Supported file formats:

- Markdown `CHANGELOG.md` and AsciiDoc `CHANGELOG.adoc`
  in [Keep a Changelog](https://keepachangelog.com/en/1.1.0) format.
- `package.json` files.

## Command-Line Tool
### Installation
```shell
npm install --save-dev --save-exact @rainstormy/updraft
```
or
```shell
pnpm install --save-dev --save-exact @rainstormy/updraft
```
or
```shell
yarn add --dev --exact @rainstormy/updraft
```

### Usage
```shell
updraft [options]
```

Examples:
```shell
updraft --files 'CHANGELOG.md' 'package.json' --release-version '1.1.0'
```
```shell
updraft \
  --files 'package.json' 'packages/**/package.json' \
  --release-files 'CHANGELOG.md' \
  --check-sequential-release \
  --release-version '2.0.0-beta.1'
```

### Options
#### `--check-sequential-release`
Verify that `--release-version` specifies a valid increment from the latest
version detected in each file to be updated.

#### `--files <pattern-1> <pattern-2> <pattern-3>...`
Update the files matching the specified glob patterns
whenever `--release-version` is specified.

#### `--prerelease-files <pattern-1> <pattern-2> <pattern-3>...`
Update the files matching the specified glob patterns only
when `--release-version` has a `-prerelease` or `+buildinfo` segment.

#### `--release-files <pattern-1> <pattern-2> <pattern-3>...`
Update the files matching the specified glob patterns only
when `--release-version` does not have a `-prerelease` or `+buildinfo` segment.

#### `--release-version <major.minor.patch[-prerelease][+buildinfo]>`
The [semantic version number](https://semver.org) (SemVer) of the next release.
The `-prerelease` and `+buildinfo` segments are optional. It accepts any input
containing a substring that is a semantic version number, e.g. `v2.0.0`
or `release/1.5.0-rc.0`.
