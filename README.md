# Updraft &ndash; Release Automation

Updraft prepares a repository for an upcoming release by updating changelogs and
bumping version numbers in `package.json` files.

It saves the changes to the files, but it does not make any Git commits or
GitHub releases. You can automate these things in your CI/CD pipeline (it works
well with the [`rainstormy/release`](https://github.com/rainstormy/release)
actions), or you can do them manually after running the Updraft tool.

Supported file formats:

- Markdown `CHANGELOG.md` and AsciiDoc `CHANGELOG.adoc`
  in [Keep a Changelog](https://keepachangelog.com/en/1.1.0) format.
- `package.json` files.

## Command-Line Interface (CLI)
### Installation
Install
the [`@rainstormy/updraft`](https://www.npmjs.com/package/@rainstormy/updraft)
package with the package manager of your choice:

```shell
npm install --save-dev @rainstormy/updraft
```
```shell
pnpm add --save-dev @rainstormy/updraft
```
```shell
yarn add --dev @rainstormy/updraft
```

### Usage
```shell
updraft [options]
```

Examples (see the [Options reference](#options) below):

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

## GitHub Actions
### Usage
Use the `rainstormy/updraft` action to run Updraft on the file system of the
GitHub Actions runner.

Examples (see the [Options reference](#options) below):

```yaml
jobs:
  prepare-release:
    runs-on: ubuntu-24.04
    timeout-minutes: 1
    permissions: { }
    steps:
      - name: Check out the repository
        uses: actions/checkout@v4
        #
      - name: Update release artefacts
        uses: rainstormy/updraft@v1
        with:
          files: package.json
          release-files: CHANGELOG.md
          release-version: 1.1.0
```
```yaml
jobs:
  prepare-release:
    runs-on: ubuntu-24.04
    timeout-minutes: 1
    permissions: { }
    steps:
      - name: Check out the repository
        uses: actions/checkout@v4
        #
      - name: Update release artefacts
        uses: rainstormy/updraft@v1
        with:
          check-sequential-release: true
          files: |
            package.json
            packages/**/package.json
          release-files: CHANGELOG.md
          release-version: ${{ inputs.version || github.head_ref }}
```

## Options
### `check-sequential-release`
Verify that [`release-version`](#release-version) specifies a valid increment
from the latest version detected in each file to be updated.

```shell
# CLI:
updraft --check-sequential-release
```
```yaml
# GitHub Actions:
with:
  check-sequential-release: true
```

### `files`
Update the files matching the specified glob patterns
whenever [`release-version`](#release-version) is specified.

```shell
# CLI:
updraft --files <pattern-1> <pattern-2> <pattern-3>...
```
```yaml
# GitHub Actions:
with:
  files: |
    <pattern-1>
    <pattern-2>
    <pattern-3>
    ...
```

### `prerelease-files`
Update the files matching the specified glob patterns only
when [`release-version`](#release-version) has a `-prerelease` or `+buildinfo`
segment.

```shell
# CLI:
updraft --prerelease-files <pattern-1> <pattern-2> <pattern-3>...
```
```yaml
# GitHub Actions:
with:
  prerelease-files: |
    <pattern-1>
    <pattern-2>
    <pattern-3>
    ...
```

### `release-files`
Update the files matching the specified glob patterns only
when [`release-version`](#release-version) does not have a `-prerelease` or
`+buildinfo` segment.

```shell
# CLI:
updraft --release-files <pattern-1> <pattern-2> <pattern-3>...
```
```yaml
# GitHub Actions:
with:
  release-files: |
    <pattern-1>
    <pattern-2>
    <pattern-3>
    ...
```

### `release-version`
The [semantic version number](https://semver.org) (SemVer) of the next release
on the form `<major.minor.patch[-prerelease][+buildinfo]>`. The `-prerelease`
and `+buildinfo` segments are optional.

It accepts any input containing a substring that is a semantic version number,
e.g. `v2.0.0` or `release/1.5.0-rc.0`.

```shell
# CLI:
updraft --release-version <major.minor.patch[-prerelease][+buildinfo]>
```
```yaml
# GitHub Actions:
with:
  release-version: <major.minor.patch[-prerelease][+buildinfo]>
```
