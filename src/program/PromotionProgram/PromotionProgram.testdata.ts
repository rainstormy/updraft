import type { File } from "+adapters/FileSystem/File"
import type { Release } from "+utilities/Release"
import { dedent } from "+utilities/StringUtilities"

export function getAsciidocChangelogDummies(release: Release): {
	emptyFile: File
	nonPromotableFile: File
	promotableFiles: [File, File, File, File]
	expectedPromotedFiles: [File, File, File, File]
} {
	return {
		emptyFile: {
			path: "CHANGELOG.adoc",
			content: "",
		},
		nonPromotableFile: {
			path: "packages/bananas/CHANGELOG.adoc",
			content: dedent`
				= Changes

				== {url-github}[Unreleased]

				== {url-github}/releases/tag/v0.1.0[0.1.0] - 2024-05-14
				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
		},
		promotableFiles: [
			{
				path: "CHANGELOG.adoc",
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
			},
			{
				path: "packages/apples/CHANGELOG.adoc",
				content: dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			},
			{
				path: "packages/oranges/CHANGELOG.adoc",
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
			},
			{
				path: "packages/peaches/CHANGELOG.adoc",
				content: dedent`
					= Changes


					== https://github.com/rainstormy/updraft[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.

					=== Fixed
					* Milk in the refrigerator is now fresh.
				`,
			},
		],
		expectedPromotedFiles: [
			{
				path: "CHANGELOG.adoc",
				content: `${dedent`
					= Changelog
					:experimental:
					:source-highlighter: highlight.js

					This file documents all notable changes to this project.
					The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

					== {url-repo}/compare/v${release.version}\\...HEAD[Unreleased]

					== {url-repo}/compare/v2.0.0-rc.1\\...v${release.version}[${release.version}] - ${release.date}
					=== Changed
					* The fruit basket is now refilled every day.

					== {url-repo}/releases/tag/v2.0.0-rc.1[2.0.0-rc.1] - 2023-12-03
					=== Added
					* A new shiny fruit basket.
				`}\n`,
			},
			{
				path: "packages/apples/CHANGELOG.adoc",
				content: `${dedent`
					= Changelog

					== {url-github}/compare/v${release.version}\\...HEAD[Unreleased]

					== {url-github}/releases/tag/v${release.version}[${release.version}] - ${release.date}
					=== Added
					* A new shower mode: \`jet-stream\`.
				`}\n`,
			},
			{
				path: "packages/oranges/CHANGELOG.adoc",
				content: `${dedent`
					= Releases

					== https://github.com/spdiswal/coolciv/compare/v${release.version}\\...HEAD[Unreleased]

					== https://github.com/spdiswal/coolciv/compare/v0.9.9\\...v${release.version}[${release.version}] - ${release.date}
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
			},
			{
				path: "packages/peaches/CHANGELOG.adoc",
				content: `${dedent`
					= Changes

					== https://github.com/rainstormy/updraft/compare/v${release.version}\\...HEAD[Unreleased]

					== https://github.com/rainstormy/updraft/releases/tag/v${release.version}[${release.version}] - ${release.date}
					=== Changed
					* The fruit basket is now refilled every day.

					=== Fixed
					* Milk in the refrigerator is now fresh.
				`}\n`,
			},
		],
	}
}

export function getMarkdownChangelogDummies(release: Release): {
	emptyFile: File
	nonPromotableFile: File
	promotableFiles: [File, File, File, File]
	expectedPromotedFiles: [File, File, File, File]
} {
	return {
		emptyFile: {
			path: "CHANGELOG.md",
			content: "",
		},
		nonPromotableFile: {
			path: "packages/bananas/CHANGELOG.md",
			content: dedent`
				# Changes

				## [Unreleased](https://github.com/rainstormy/github-action-validate-commit-messages)

				## [0.1.0](https://github.com/rainstormy/github-action-validate-commit-messages/releases/tag/v0.1.0) - 2024-05-14
				### Added
				- A new cold water dispenser.
				- Skylights in the ceiling.
			`,
		},
		promotableFiles: [
			{
				path: "CHANGELOG.md",
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
			},
			{
				path: "packages/apples/CHANGELOG.md",
				content: dedent`
					# Changelog


					## [Unreleased](https://github.com/rainstormy/github-action-validate-commit-messages)

					### Added
					- A new shower mode: \`jet-stream\`.
				`,
			},
			{
				path: "packages/oranges/CHANGELOG.md",
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
			},
			{
				path: "packages/peaches/CHANGELOG.md",
				content: dedent`
					# Changes


					## [Unreleased](https://github.com/rainstormy/updraft)

					### Changed
					- The fruit basket is now refilled every day.

					### Fixed
					- Milk in the refrigerator is now fresh.
				`,
			},
		],
		expectedPromotedFiles: [
			{
				path: "CHANGELOG.md",
				content: `${dedent`
					# Changelog
					This file documents all notable changes to this project.

					The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0),
					and this project adheres
					to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

					## [Unreleased](https://github.com/rainstormy-actions/release/compare/v${release.version}...HEAD)

					## [${release.version}](https://github.com/rainstormy-actions/release/compare/v2.0.0-rc.1...v${release.version}) - ${release.date}
					### Changed
					- The fruit basket is now refilled every day.

					## [2.0.0-rc.1](https://github.com/rainstormy-actions/release/releases/tag/v2.0.0-rc.1) - 2023-12-03
					### Added
					- A new shiny fruit basket.
				`}\n`,
			},
			{
				path: "packages/apples/CHANGELOG.md",
				content: `${dedent`
					# Changelog

					## [Unreleased](https://github.com/rainstormy/github-action-validate-commit-messages/compare/v${release.version}...HEAD)

					## [${release.version}](https://github.com/rainstormy/github-action-validate-commit-messages/releases/tag/v${release.version}) - ${release.date}
					### Added
					- A new shower mode: \`jet-stream\`.
				`}\n`,
			},
			{
				path: "packages/oranges/CHANGELOG.md",
				content: `${dedent`
					# Releases

					## [Unreleased](https://github.com/spdiswal/coolciv/compare/v${release.version}...HEAD)

					## [${release.version}](https://github.com/spdiswal/coolciv/compare/v0.9.9...v${release.version}) - ${release.date}
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
			},
			{
				path: "packages/peaches/CHANGELOG.md",
				content: `${dedent`
					# Changes

					## [Unreleased](https://github.com/rainstormy/updraft/compare/v${release.version}...HEAD)

					## [${release.version}](https://github.com/rainstormy/updraft/releases/tag/v${release.version}) - ${release.date}
					### Changed
					- The fruit basket is now refilled every day.

					### Fixed
					- Milk in the refrigerator is now fresh.
				`}\n`,
			},
		],
	}
}

export function getPackageJsonDummies(release: Release): {
	emptyFile: File
	nonPromotableFile: File
	promotableFiles: [File, File, File, File]
	expectedPromotedFiles: [File, File, File, File]
} {
	return {
		emptyFile: {
			path: "package.json",
			content: "",
		},
		nonPromotableFile: {
			path: "packages/bananas/package.json",
			content: dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"private": true,
					"type": "module",
					"packageManager": "yarn@3.6.3"
				}
			`,
		},
		promotableFiles: [
			{
				path: "package.json",
				content: dedent`
					{
						"version": "1.1.0",
						"name": "@rainstormy/updraft",
						"type": "module",
					}
				`,
			},
			{
				path: "packages/apples/package.json",
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
			},
			{
				path: "packages/oranges/package.json",
				content: dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/oranges",
						"main": "dist/oranges.js",
						"version": "1.0.12",
						"packageManager": "pnpm@9.2.0"
					}
				`,
			},
			{
				path: "packages/peaches/package.json",
				content: dedent`
					{
						"name": "@rainstormy/peaches",
						"version": "2.0.0-rc.3"
					}
				`,
			},
		],
		expectedPromotedFiles: [
			{
				path: "package.json",
				content: `${dedent`
					{
						"version": "${release.version}",
						"name": "@rainstormy/updraft",
						"type": "module",
					}
				`}\n`,
			},
			{
				path: "packages/apples/package.json",
				content: `${dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/apples",
						"version": "${release.version}",
						"type": "module",
						"main": "dist/apples.js",
						"types": "dist/apples.d.ts",
						"files": ["dist"],
						"packageManager": "yarn@4.0.1"
					}
				`}\n`,
			},
			{
				path: "packages/oranges/package.json",
				content: `${dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/oranges",
						"main": "dist/oranges.js",
						"version": "${release.version}",
						"packageManager": "pnpm@9.2.0"
					}
				`}\n`,
			},
			{
				path: "packages/peaches/package.json",
				content: `${dedent`
					{
						"name": "@rainstormy/peaches",
						"version": "${release.version}"
					}
				`}\n`,
			},
		],
	}
}

export function getDeprecatedDummies(release: Release): {
	promotableFiles: [File, File]
	expectedPromotedFiles: [File, File]
} {
	return {
		promotableFiles: [
			{
				path: "RELEASES.adoc",
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
			},
			{
				path: "HISTORY.md",
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
			},
		],
		expectedPromotedFiles: [
			{
				path: "RELEASES.adoc",
				content: `${dedent`
					= Changelog
					:experimental:
					:source-highlighter: highlight.js

					This file documents all notable changes to this project.
					The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

					== {url-repo}/compare/v${release.version}\\...HEAD[Unreleased]

					== {url-repo}/compare/v2.0.0-rc.1\\...v${release.version}[${release.version}] - ${release.date}
					=== Changed
					* The fruit basket is now refilled every day.

					== {url-repo}/releases/tag/v2.0.0-rc.1[2.0.0-rc.1] - 2023-12-03
					=== Added
					* A new shiny fruit basket.
				`}\n`,
			},
			{
				path: "HISTORY.md",
				content: `${dedent`
					# Changelog
					This file documents all notable changes to this project.

					The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0),
					and this project adheres
					to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

					## [Unreleased](https://github.com/rainstormy-actions/release/compare/v${release.version}...HEAD)

					## [${release.version}](https://github.com/rainstormy-actions/release/compare/v2.0.0-rc.1...v${release.version}) - ${release.date}
					### Changed
					- The fruit basket is now refilled every day.

					## [2.0.0-rc.1](https://github.com/rainstormy-actions/release/releases/tag/v2.0.0-rc.1) - 2023-12-03
					### Added
					- A new shiny fruit basket.
				`}\n`,
			},
		],
	}
}

export function getUnsupportedDummies(): [File, File] {
	return [
		{
			path: "changelog.txt",
			content: "Changelog",
		},
		{
			path: "CHANGES",
			content: "This document lists all notable changes made to the project.",
		},
	]
}
