import type { File } from "+adapters/FileSystem/File"
import {
	type DateString,
	type SemanticVersionString,
	dedent,
} from "+utilities/StringUtilities"

export function anEmptyAsciidocChangelog(
	path: AsciidocChangelogFilepath,
): File {
	return { path, content: "" }
}

export function aNonPromotableAsciidocChangelog(
	path: AsciidocChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			= Changes

			== {url-github}[Unreleased]

			== {url-github}/releases/tag/v0.1.0[0.1.0] - 2024-05-14
			=== Added
			* A new cold water dispenser.
			* Skylights in the ceiling.
		`,
	}
}

export function aPromotableAsciidocChangelogA(
	path: AsciidocChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			= Changelog
			:experimental:
			:source-highlighter: highlight.js

			This file documents all notable changes to this project.
			The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

			== {url-repo}/compare/v2.0.0-rc.1\\...HEAD[Unreleased]
			=== Changed
			* The fruit basket is now refilled every day.

			== {url-repo}/releases/tag/v2.0.0-rc.1[2.0.0-rc.1] - 2023-12-03
			=== Added
			* A new shiny fruit basket.
		`,
	}
}

export function aPromotedAsciidocChangelogA(
	path: AsciidocChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			= Changelog
			:experimental:
			:source-highlighter: highlight.js

			This file documents all notable changes to this project.
			The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

			== {url-repo}/compare/v${releaseVersion}\\...HEAD[Unreleased]

			== {url-repo}/compare/v2.0.0-rc.1\\...v${releaseVersion}[${releaseVersion}] - ${releaseDate}
			=== Changed
			* The fruit basket is now refilled every day.

			== {url-repo}/releases/tag/v2.0.0-rc.1[2.0.0-rc.1] - 2023-12-03
			=== Added
			* A new shiny fruit basket.
		`}\n`,
	}
}

export function aPromotableAsciidocChangelogB(
	path: AsciidocChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			= Changelog


			== {url-github}[Unreleased]

			=== Added
			* A new shower mode: \`jet-stream\`.
		`,
	}
}

export function aPromotedAsciidocChangelogB(
	path: AsciidocChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			= Changelog

			== {url-github}/compare/v${releaseVersion}\\...HEAD[Unreleased]

			== {url-github}/releases/tag/v${releaseVersion}[${releaseVersion}] - ${releaseDate}
			=== Added
			* A new shower mode: \`jet-stream\`.
		`}\n`,
	}
}

export function aPromotableAsciidocChangelogC(
	path: AsciidocChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			= Releases

			== https://github.com/spdiswal/coolciv/compare/v0.9.9...HEAD[Unreleased]
			=== Fixed
			* Office chairs are now more comfortable.
			* Books on the shelf are now alphabetically sorted.

			=== Changed
			* The office is now open 24/7.

			== https://github.com/spdiswal/coolciv/releases/tag/v0.9.9[0.9.9] - 2023-04-09
			=== Added
			* A new cold water dispenser.
			* Skylights in the ceiling.
		`,
	}
}

export function aPromotedAsciidocChangelogC(
	path: AsciidocChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			= Releases

			== https://github.com/spdiswal/coolciv/compare/v${releaseVersion}\\...HEAD[Unreleased]

			== https://github.com/spdiswal/coolciv/compare/v0.9.9\\...v${releaseVersion}[${releaseVersion}] - ${releaseDate}
			=== Fixed
			* Office chairs are now more comfortable.
			* Books on the shelf are now alphabetically sorted.

			=== Changed
			* The office is now open 24/7.

			== https://github.com/spdiswal/coolciv/releases/tag/v0.9.9[0.9.9] - 2023-04-09
			=== Added
			* A new cold water dispenser.
			* Skylights in the ceiling.
		`}\n`,
	}
}

export function aPromotableAsciidocChangelogD(
	path: AsciidocChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			= Changes


			== https://github.com/rainstormy/updraft[Unreleased]

			=== Changed
			* The fruit basket is now refilled every day.

			=== Fixed
			* Milk in the refrigerator is now fresh.
		`,
	}
}

export function aPromotedAsciidocChangelogD(
	path: AsciidocChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			= Changes

			== https://github.com/rainstormy/updraft/compare/v${releaseVersion}\\...HEAD[Unreleased]

			== https://github.com/rainstormy/updraft/releases/tag/v${releaseVersion}[${releaseVersion}] - ${releaseDate}
			=== Changed
			* The fruit basket is now refilled every day.

			=== Fixed
			* Milk in the refrigerator is now fresh.
		`}\n`,
	}
}

export function anEmptyMarkdownChangelog(
	path: MarkdownChangelogFilepath,
): File {
	return { path, content: "" }
}

export function aNonPromotableMarkdownChangelog(
	path: MarkdownChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			# Changes

			## [Unreleased](https://github.com/rainstormy/github-action-validate-commit-messages)

			## [0.1.0](https://github.com/rainstormy/github-action-validate-commit-messages/releases/tag/v0.1.0) - 2024-05-14
			### Added
			- A new cold water dispenser.
			- Skylights in the ceiling.
		`,
	}
}

export function aPromotableMarkdownChangelogA(
	path: MarkdownChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			# Changelog
			This file documents all notable changes to this project.

			The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0),
			and this project adheres
			to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

			## [Unreleased](https://github.com/rainstormy-actions/release/compare/v2.0.0-rc.1...HEAD)
			### Changed
			- The fruit basket is now refilled every day.

			## [2.0.0-rc.1](https://github.com/rainstormy-actions/release/releases/tag/v2.0.0-rc.1) - 2023-12-03
			### Added
			- A new shiny fruit basket.
		`,
	}
}

export function aPromotedMarkdownChangelogA(
	path: MarkdownChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			# Changelog
			This file documents all notable changes to this project.

			The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0),
			and this project adheres
			to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

			## [Unreleased](https://github.com/rainstormy-actions/release/compare/v${releaseVersion}...HEAD)

			## [${releaseVersion}](https://github.com/rainstormy-actions/release/compare/v2.0.0-rc.1...v${releaseVersion}) - ${releaseDate}
			### Changed
			- The fruit basket is now refilled every day.

			## [2.0.0-rc.1](https://github.com/rainstormy-actions/release/releases/tag/v2.0.0-rc.1) - 2023-12-03
			### Added
			- A new shiny fruit basket.
		`}\n`,
	}
}

export function aPromotableMarkdownChangelogB(
	path: MarkdownChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			# Changelog


			## [Unreleased](https://github.com/rainstormy/github-action-validate-commit-messages)

			### Added
			- A new shower mode: \`jet-stream\`.
		`,
	}
}

export function aPromotedMarkdownChangelogB(
	path: MarkdownChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			# Changelog

			## [Unreleased](https://github.com/rainstormy/github-action-validate-commit-messages/compare/v${releaseVersion}...HEAD)

			## [${releaseVersion}](https://github.com/rainstormy/github-action-validate-commit-messages/releases/tag/v${releaseVersion}) - ${releaseDate}
			### Added
			- A new shower mode: \`jet-stream\`.
		`}\n`,
	}
}

export function aPromotableMarkdownChangelogC(
	path: MarkdownChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			# Releases

			## [Unreleased](https://github.com/spdiswal/coolciv/compare/v0.9.9...HEAD)
			### Fixed
			- Office chairs are now more comfortable.
			- Books on the shelf are now alphabetically sorted.

			### Changed
			- The office is now open 24/7.

			## [0.9.9](https://github.com/spdiswal/coolciv/releases/tag/v0.9.9) - 2023-04-09
			### Added
			- A new cold water dispenser.
			- Skylights in the ceiling.
		`,
	}
}

export function aPromotedMarkdownChangelogC(
	path: MarkdownChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			# Releases

			## [Unreleased](https://github.com/spdiswal/coolciv/compare/v${releaseVersion}...HEAD)

			## [${releaseVersion}](https://github.com/spdiswal/coolciv/compare/v0.9.9...v${releaseVersion}) - ${releaseDate}
			### Fixed
			- Office chairs are now more comfortable.
			- Books on the shelf are now alphabetically sorted.

			### Changed
			- The office is now open 24/7.

			## [0.9.9](https://github.com/spdiswal/coolciv/releases/tag/v0.9.9) - 2023-04-09
			### Added
			- A new cold water dispenser.
			- Skylights in the ceiling.
		`}\n`,
	}
}

export function aPromotableMarkdownChangelogD(
	path: MarkdownChangelogFilepath,
): File {
	return {
		path,
		content: dedent`
			# Changes


			## [Unreleased](https://github.com/rainstormy/updraft)

			### Changed
			- The fruit basket is now refilled every day.

			### Fixed
			- Milk in the refrigerator is now fresh.
		`,
	}
}

export function aPromotedMarkdownChangelogD(
	path: MarkdownChangelogFilepath,
	releaseVersion: SemanticVersionString,
	releaseDate: DateString,
): File {
	return {
		path,
		content: `${dedent`
			# Changes

			## [Unreleased](https://github.com/rainstormy/updraft/compare/v${releaseVersion}...HEAD)

			## [${releaseVersion}](https://github.com/rainstormy/updraft/releases/tag/v${releaseVersion}) - ${releaseDate}
			### Changed
			- The fruit basket is now refilled every day.

			### Fixed
			- Milk in the refrigerator is now fresh.
		`}\n`,
	}
}

export function anEmptyPackageJson(path: PackageJsonFilepath): File {
	return { path, content: "" }
}

export function aNonPromotablePackageJson(path: PackageJsonFilepath): File {
	return {
		path,
		content: dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"private": true,
				"type": "module",
				"packageManager": "yarn@3.6.3"
			}
		`,
	}
}

export function aPromotablePackageJsonA(path: PackageJsonFilepath): File {
	return {
		path,
		content: dedent`
			{
				"version": "1.1.0",
				"name": "@rainstormy/updraft",
				"type": "module",
			}
		`,
	}
}

export function aPromotedPackageJsonA(
	path: PackageJsonFilepath,
	releaseVersion: SemanticVersionString,
): File {
	return {
		path,
		content: `${dedent`
			{
				"version": "${releaseVersion}",
				"name": "@rainstormy/updraft",
				"type": "module",
			}
		`}\n`,
	}
}

export function aPromotablePackageJsonB(path: PackageJsonFilepath): File {
	return {
		path,
		content: dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/apples",
				"version": "0.8.4",
				"type": "module",
				"main": "dist/apples.js",
				"types": "dist/apples.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@4.0.1"
			}
		`,
	}
}

export function aPromotedPackageJsonB(
	path: PackageJsonFilepath,
	releaseVersion: SemanticVersionString,
): File {
	return {
		path,
		content: `${dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/apples",
				"version": "${releaseVersion}",
				"type": "module",
				"main": "dist/apples.js",
				"types": "dist/apples.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@4.0.1"
			}
		`}\n`,
	}
}

export function aPromotablePackageJsonC(path: PackageJsonFilepath): File {
	return {
		path,
		content: dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/oranges",
				"main": "dist/oranges.js",
				"version": "1.0.12",
				"packageManager": "pnpm@9.2.0"
			}
		`,
	}
}

export function aPromotedPackageJsonC(
	path: PackageJsonFilepath,
	releaseVersion: SemanticVersionString,
): File {
	return {
		path,
		content: `${dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/oranges",
				"main": "dist/oranges.js",
				"version": "${releaseVersion}",
				"packageManager": "pnpm@9.2.0"
			}
		`}\n`,
	}
}

export function aPromotablePackageJsonD(path: PackageJsonFilepath): File {
	return {
		path,
		content: dedent`
			{
				"name": "@rainstormy/peaches",
				"version": "2.0.0-rc.3"
			}
		`,
	}
}

export function aPromotedPackageJsonD(
	path: PackageJsonFilepath,
	releaseVersion: SemanticVersionString,
): File {
	return {
		path,
		content: `${dedent`
			{
				"name": "@rainstormy/peaches",
				"version": "${releaseVersion}"
			}
		`}\n`,
	}
}

export function anUnsupportedFileA<Path extends string>(
	path: UnsupportedFilepath<Path>,
): File {
	return {
		path,
		content: "Changelog",
	}
}

export function anUnsupportedFileB<Path extends string>(
	path: UnsupportedFilepath<Path>,
): File {
	return {
		path,
		content: "This document lists all notable changes made to the project.",
	}
}

export type AsciidocChangelogFilepath = `${string}.adoc`
export type MarkdownChangelogFilepath = `${string}.md`
export type PackageJsonFilepath = `${string}package.json`

// biome-ignore format: This type is easier to read and maintain linearly.
export type UnsupportedFilepath<Path> =
	| Path extends AsciidocChangelogFilepath ? never
	: Path extends MarkdownChangelogFilepath ? never
	: Path extends PackageJsonFilepath ? never
	: Path
