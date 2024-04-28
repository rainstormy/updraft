# Updraft &ndash; Release Automation

Updraft is a generic command-line tool that prepares a repository for an
upcoming release by updating changelogs and bumping version numbers
in `package.json` files.

It saves the changes to the files, but it does not make any Git commits or
GitHub releases. You can automate these things in your CI/CD pipeline or do them
manually after running the Updraft tool.

Supported file formats:

* AsciiDoc-based changelogs (`*.adoc`)
  in [Keep a Changelog](https://keepachangelog.com/en/1.1.0) format.
* `package.json` files.

### Usage
```shell
updraft --files <glob patterns> --release-version <major.minor.patch[-prerelease][+buildinfo]>
```

### Local Installation (Recommended)
This approach is faster and more reliable in the long run than downloading and
running Updraft in a temporary environment for every release of your project.

1. Install the `@rainstormy/updraft` package locally in your project:
   ```shell
   npm install --save-dev @rainstormy/updraft
   ```
   ```shell
   pnpm install --save-dev @rainstormy/updraft
   ```
   ```shell
   yarn add --dev @rainstormy/updraft
   ```

2. Define a script in `package.json` to run the program, for example with a
   constant set of files and a variable release version:
   ```yml
   "scripts": {
       "release.prepare": "updraft --files CHANGELOG.adoc packages/**/package.json --release-version"
   }
   ```

3. Run the script from the project root directory and supply the necessary
   arguments, for example:
   ```shell
   npm run release.prepare -- 1.1.0
   ```
   ```shell
   pnpm release.prepare 1.1.0
   ```
   ```shell
   yarn release.prepare 1.1.0
   ```

> [!TIP]  
> If you don't want to define a package script, you can also run the locally
> installed tool directly, for example:
> ```shell
> npm exec updraft -- --files CHANGELOG.adoc packages/**/package.json --release-version 1.1.0
> ```
> ```shell
> pnpm exec updraft --files CHANGELOG.adoc packages/**/package.json --release-version 1.1.0
> ```
> ```shell
> yarn run updraft --files CHANGELOG.adoc packages/**/package.json --release-version 1.1.0
> ```

### Temporary Environment
1. Download and run the `@rainstormy/updraft` package in a temporary environment
   without installing it as a dependency to your project, for example:
   ```shell
   npx @rainstormy/updraft --files CHANGELOG.adoc packages/**/package.json --release-version 1.1.0
   ```
   ```shell
   pnpm dlx @rainstormy/updraft --files CHANGELOG.adoc packages/**/package.json --release-version 1.1.0
   ```
   ```shell
   yarn dlx @rainstormy/updraft --files CHANGELOG.adoc packages/**/package.json --release-version 1.1.0
   ```
