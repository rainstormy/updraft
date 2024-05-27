import type { Files } from "+adapters/FileSystem/File"
import { injectFileSystemMock } from "+adapters/FileSystem/FileSystem.mock"
import { injectLoggerMock } from "+adapters/Logger/Logger.mock"
import { injectTodayMock } from "+adapters/Today/Today.mock"
import { mainProgram } from "+program/Program"
import type { ExitCode } from "+utilities/ErrorUtilities"
import {
	type DateString,
	type SemanticVersionString,
	dedent,
} from "+utilities/StringUtilities"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { today } = injectTodayMock()
const { printMessage, printWarning, printError } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

beforeEach(() => {
	vi.clearAllMocks()
})

describe.each`
	filePatterns                                      | expectedWarning
	${["CHANGELOG.adoc"]}                             | ${"CHANGELOG.adoc did not match any files."}
	${["package.json"]}                               | ${"package.json did not match any files."}
	${["CHANGELOG.adoc", "packages/**/package.json"]} | ${"CHANGELOG.adoc, packages/**/package.json did not match any files."}
	${["**/package.json", "**/*.adoc"]}               | ${"**/package.json, **/*.adoc did not match any files."}
`(
	"when $filePatterns does not match any files",
	(props: {
		filePatterns: Array<string>
		expectedWarning: string
	}) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			readMatchingFiles.mockImplementation(async () => [
				// No matched files.
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.filePatterns,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("displays a warning", () => {
			expect(printWarning).toHaveBeenCalledWith(props.expectedWarning)
			expect(printWarning).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | releaseVersion    | releaseDate
	${"CHANGELOG.adoc"}      | ${"1.4.11"}       | ${"2023-10-26"}
	${"lib/RELEASES.adoc"}   | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when $matchedChangelogFilename matches a changelog file that can be promoted",
	async (props: {
		matchedChangelogFilename: string
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const originalContent = dedent`
			= Changelog

			== {url-repo}[Unreleased]

			=== Changed
			* The fruit basket is now refilled every day.
		`

		const promotedContent = dedent`
			= Changelog


			== {url-repo}/compare/v${props.releaseVersion}\\...HEAD[Unreleased]


			== {url-repo}/releases/tag/v${props.releaseVersion}[${props.releaseVersion}] - ${props.releaseDate}

			=== Changed
			* The fruit basket is now refilled every day.
		`

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => props.releaseDate)
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContent,
					path: props.matchedChangelogFilename,
					type: "asciidoc-changelog",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				props.matchedChangelogFilename,
				"--release-version",
				props.releaseVersion,
			])
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog file", () => {
			expect(writeFiles).toHaveBeenCalledWith([
				{
					content: promotedContent,
					path: props.matchedChangelogFilename,
					type: "asciidoc-changelog",
				},
			] satisfies Files)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilename
	${"CHANGELOG.adoc"}
	${"lib/RELEASES.adoc"}
`(
	"when $matchedChangelogFilename matches an empty changelog file",
	async (props: { matchedChangelogFilename: string }) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: "", // An empty file.
					path: props.matchedChangelogFilename,
					type: "asciidoc-changelog",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				props.matchedChangelogFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedChangelogFilename} must have an 'Unreleased' section.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename
	${"CHANGELOG.adoc"}
	${"lib/RELEASES.adoc"}
`(
	"when $matchedChangelogFilename matches a changelog file that cannot be promoted",
	async (props: { matchedChangelogFilename: string }) => {
		const originalContent = dedent`
			= Changelog

			== {url-repo}[Unreleased]
		`

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContent,
					path: props.matchedChangelogFilename,
					type: "asciidoc-changelog",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				props.matchedChangelogFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedChangelogFilename} must have at least one item in the 'Unreleased' section.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns       | unmatchedFilePatterns                 | matchedChangelogFilenames                                                                                | releaseVersion    | releaseDate
	${["packages/**/*.adoc"]} | ${["CHANGELOG.adoc", "package.json"]} | ${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${"1.4.11"}       | ${"2023-10-26"}
	${["*/CHANGELOG.adoc"]}   | ${["build/package.json"]}             | ${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when $matchedFilePatterns matches changelog files that can be promoted and $unmatchedFilePatterns does not match any files",
	async (props: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedChangelogFilenames: Array<string>
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const originalContents = [
			dedent`
				= Changelog


				== {url-github}[Unreleased]

				=== Added
				* A new shower mode: \`jet-stream\`.
			`,
			dedent`
				= Releases


				== {url-github}[Unreleased]

				=== Fixed
				* Office chairs are now more comfortable.
				* Books on the shelf are now alphabetically sorted.

				=== Changed
				* The office is now open 24/7.


				== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
			dedent`
				= Changes


				== {url-github}[Unreleased]

				=== Changed
				* The fruit basket is now refilled every day.

				=== Fixed
				* Milk in the refrigerator is now fresh.
			`,
		]

		const promotedContents = [
			dedent`
				= Changelog


				== {url-github}/compare/v${props.releaseVersion}\\...HEAD[Unreleased]


				== {url-github}/releases/tag/v${props.releaseVersion}[${props.releaseVersion}] - ${props.releaseDate}

				=== Added
				* A new shower mode: \`jet-stream\`.
			`,
			dedent`
				= Releases


				== {url-github}/compare/v${props.releaseVersion}\\...HEAD[Unreleased]


				== {url-github}/compare/v0.9.9\\...v${props.releaseVersion}[${props.releaseVersion}] - ${props.releaseDate}

				=== Fixed
				* Office chairs are now more comfortable.
				* Books on the shelf are now alphabetically sorted.

				=== Changed
				* The office is now open 24/7.


				== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
			dedent`
				= Changes


				== {url-github}/compare/v${props.releaseVersion}\\...HEAD[Unreleased]


				== {url-github}/releases/tag/v${props.releaseVersion}[${props.releaseVersion}] - ${props.releaseDate}

				=== Changed
				* The fruit basket is now refilled every day.

				=== Fixed
				* Milk in the refrigerator is now fresh.
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockReturnValue(props.releaseDate)
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[2],
					path: props.matchedChangelogFilenames[2],
					type: "asciidoc-changelog",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedFilePatterns,
				...props.unmatchedFilePatterns,
				"--release-version",
				props.releaseVersion,
			])
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("remains silent", () => {
			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog files", () => {
			expect(writeFiles).toHaveBeenCalledWith([
				{
					content: promotedContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: promotedContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: promotedContents[2],
					path: props.matchedChangelogFilenames[2],
					type: "asciidoc-changelog",
				},
			] satisfies Files)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilenames
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}
`(
	"when $matchedChangelogFilenames matches changelog files of which one cannot be promoted",
	async (props: { matchedChangelogFilenames: Array<string> }) => {
		const originalContents = [
			dedent`
				= Changelog


				== {url-github}[Unreleased]

				=== Added
				* A new shower mode: \`jet-stream\`.
			`,
			dedent`
				= Releases


				== {url-github}[Unreleased]


				== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
			dedent`
				= Changes


				== {url-github}[Unreleased]

				=== Changed
				* The fruit basket is now refilled every day.

				=== Fixed
				* Milk in the refrigerator is now fresh.
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[2],
					path: props.matchedChangelogFilenames[2],
					type: "asciidoc-changelog",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedChangelogFilenames,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedChangelogFilenames[1]} must have at least one item in the 'Unreleased' section.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns       | unmatchedFilePatterns                 | matchedChangelogFilenames
	${["packages/**/*.adoc"]} | ${["CHANGELOG.adoc", "package.json"]} | ${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]}
	${["*/CHANGELOG.adoc"]}   | ${["lib/**/package.json"]}            | ${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}
`(
	"when $matchedFilePatterns matches changelog files of which one is empty and another one cannot be promoted and $unmatchedFilePatterns does not match any files",
	async (props: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedChangelogFilenames: Array<string>
	}) => {
		const originalContents = [
			dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			"", // An empty file.
			dedent`
					= Changes


					== {url-github}[Unreleased]
				`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[2],
					path: props.matchedChangelogFilenames[2],
					type: "asciidoc-changelog",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedFilePatterns,
				...props.unmatchedFilePatterns,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays two errors", () => {
			expect(printError).toHaveBeenNthCalledWith(
				1,
				`${props.matchedChangelogFilenames[1]} must have an 'Unreleased' section.`,
			)
			expect(printError).toHaveBeenNthCalledWith(
				2,
				`${props.matchedChangelogFilenames[2]} must have at least one item in the 'Unreleased' section.`,
			)

			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(printError).toHaveBeenCalledTimes(2)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedPackageJsonFilename | releaseVersion    | releaseDate
	${"package.json"}          | ${"1.4.11"}       | ${"2023-10-26"}
	${"lib/package.json"}      | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when $matchedPackageJsonFilename matches a package.json file that can be promoted",
	async (props: {
		matchedPackageJsonFilename: string
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const originalContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/preset-prettier-base",
				"version": "0.8.6",
				"type": "module",
				"main": "dist/prettier.config.js",
				"types": "dist/prettier.config.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@3.6.3"
			}
		`

		const promotedContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/preset-prettier-base",
				"version": "${props.releaseVersion}",
				"type": "module",
				"main": "dist/prettier.config.js",
				"types": "dist/prettier.config.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@3.6.3"
			}
		`

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockReturnValue(props.releaseDate)
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContent,
					path: props.matchedPackageJsonFilename,
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				props.matchedPackageJsonFilename,
				"--release-version",
				props.releaseVersion,
			])
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
		})

		it("saves the promoted package.json file", () => {
			expect(writeFiles).toHaveBeenCalledWith([
				{
					content: promotedContent,
					path: props.matchedPackageJsonFilename,
					type: "package-json",
				},
			] satisfies Files)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedPackageJsonFilename
	${"package.json"}
	${"lib/package.json"}
`(
	"when $matchedPackageJsonFilename matches an empty package.json file",
	async (props: { matchedPackageJsonFilename: string }) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: "", // An empty file.
					path: props.matchedPackageJsonFilename,
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				props.matchedPackageJsonFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedPackageJsonFilename} must have a 'version' field.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedPackageJsonFilename
	${"package.json"}
	${"lib/package.json"}
`(
	"when $matchedPackageJsonFilename matches a package.json file that cannot be promoted",
	async (props: { matchedPackageJsonFilename: string }) => {
		const originalContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"private": true,
				"type": "module",
				"packageManager": "yarn@3.6.3"
			}
		`

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContent,
					path: props.matchedPackageJsonFilename,
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				props.matchedPackageJsonFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedPackageJsonFilename} must have a 'version' field.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns             | unmatchedFilePatterns                             | matchedPackageJsonFilenames                                                                           | releaseVersion    | releaseDate
	${["packages/**/package.json"]} | ${["packages/**/CHANGELOG.adoc", "package.json"]} | ${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${"1.4.11"}       | ${"2023-10-26"}
	${["*/package.json"]}           | ${["*/CHANGESETS.adoc"]}                          | ${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when $matchedFilePatterns matches package.json files that can be promoted and $unmatchedFilePatterns does not match any files",
	async (props: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedPackageJsonFilenames: Array<string>
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const originalContents = [
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/apples",
					"version": "1.0.12",
					"type": "module",
					"main": "dist/apples.js",
					"types": "dist/apples.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/oranges",
					"version": "1.0.12",
					"type": "module",
					"main": "dist/oranges.js",
					"types": "dist/oranges.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/peaches",
					"version": "1.0.12",
					"type": "module",
					"main": "dist/peaches.js",
					"types": "dist/peaches.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
		]

		const promotedContents = [
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/apples",
					"version": "${props.releaseVersion}",
					"type": "module",
					"main": "dist/apples.js",
					"types": "dist/apples.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/oranges",
					"version": "${props.releaseVersion}",
					"type": "module",
					"main": "dist/oranges.js",
					"types": "dist/oranges.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/peaches",
					"version": "${props.releaseVersion}",
					"type": "module",
					"main": "dist/peaches.js",
					"types": "dist/peaches.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockReturnValue(props.releaseDate)
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: originalContents[1],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
				{
					content: originalContents[2],
					path: props.matchedPackageJsonFilenames[2],
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedFilePatterns,
				...props.unmatchedFilePatterns,
				"--release-version",
				props.releaseVersion,
			])
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("remains silent", () => {
			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
		})

		it("saves the promoted package.json files", () => {
			expect(writeFiles).toHaveBeenCalledWith([
				{
					content: promotedContents[0],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: promotedContents[1],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
				{
					content: promotedContents[2],
					path: props.matchedPackageJsonFilenames[2],
					type: "package-json",
				},
			] satisfies Files)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedPackageJsonFilenames
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]}
	${["lib/package.json", "dist/package.json", "build/package.json"]}
`(
	"when $matchedPackageJsonFilenames matches package.json files of which one cannot be promoted",
	async (props: { matchedPackageJsonFilenames: Array<string> }) => {
		const originalContents = [
			dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/apples",
						"version": "0.9.1",
					}
				`,
			dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/oranges",
						"version": "0.9.1",
					}
				`,
			dedent`
					{
						"private": true,
						"type": "module",
						"packageManager": "yarn@3.6.3"
					}
				`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: originalContents[1],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
				{
					content: originalContents[2],
					path: props.matchedPackageJsonFilenames[2],
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedPackageJsonFilenames,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedPackageJsonFilenames[2]} must have a 'version' field.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns             | unmatchedFilePatterns                             | matchedPackageJsonFilenames
	${["packages/**/package.json"]} | ${["packages/**/CHANGELOG.adoc", "package.json"]} | ${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]}
	${["*/package.json"]}           | ${["*/CHANGESETS.adoc"]}                          | ${["lib/package.json", "dist/package.json", "build/package.json"]}
`(
	"when $matchedFilePatterns matches package.json files of which one is empty and another one cannot be promoted and $unmatchedFilePatterns does not match any files",
	async (props: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedPackageJsonFilenames: Array<string>
	}) => {
		const originalContents = [
			dedent`
				{
					"private": true,
				}
			`,
			"", // An empty file.
			dedent`
				{
					"name": "@rainstormy/peaches",
					"version": "0.5.0",
				}
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: originalContents[1],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
				{
					content: originalContents[2],
					path: props.matchedPackageJsonFilenames[2],
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedFilePatterns,
				...props.unmatchedFilePatterns,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays two errors", () => {
			expect(printError).toHaveBeenNthCalledWith(
				1,
				`${props.matchedPackageJsonFilenames[0]} must have a 'version' field.`,
			)
			expect(printError).toHaveBeenNthCalledWith(
				2,
				`${props.matchedPackageJsonFilenames[1]} must have a 'version' field.`,
			)

			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(printError).toHaveBeenCalledTimes(2)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | releaseVersion  | releaseDate
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"3.6.4"}      | ${"2023-12-05"}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"7.0.8-rc.1"} | ${"2024-03-23"}
`(
	"when $matchedChangelogFilename matches a changelog file that can be promoted and $matchedPackageJsonFilename matches a package.json file that can be promoted",
	async (props: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const originalContents = [
			dedent`
				= Changelog


				== {url-repo}[Unreleased]

				=== Changed
				* The fruit basket is now refilled every day.
			`,
			dedent`
				{
					"name": "@rainstormy/preset-prettier-base",
					"version": "0.8.6",
				}
			`,
		]

		const promotedContents = [
			dedent`
				= Changelog


				== {url-repo}/compare/v${props.releaseVersion}\\...HEAD[Unreleased]


				== {url-repo}/releases/tag/v${props.releaseVersion}[${props.releaseVersion}] - ${props.releaseDate}

				=== Changed
				* The fruit basket is now refilled every day.
			`,
			dedent`
				{
					"name": "@rainstormy/preset-prettier-base",
					"version": "${props.releaseVersion}",
				}
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockReturnValue(props.releaseDate)
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilename,
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedPackageJsonFilename,
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				props.matchedChangelogFilename,
				props.matchedPackageJsonFilename,
				"--release-version",
				props.releaseVersion,
			])
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog file and the promoted package.json file", () => {
			expect(writeFiles).toHaveBeenCalledWith([
				{
					content: promotedContents[0],
					path: props.matchedChangelogFilename,
					type: "asciidoc-changelog",
				},
				{
					content: promotedContents[1],
					path: props.matchedPackageJsonFilename,
					type: "package-json",
				},
			] satisfies Files)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageJsonFilenames                                          | releaseVersion  | releaseDate
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]} | ${"3.6.4"}      | ${"2023-12-05"}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}                         | ${"7.0.8-rc.1"} | ${"2024-03-23"}
`(
	"when $matchedChangelogFilenames matches changelog files of which all can be promoted and $matchedPackageJsonFilenames matches package.json files of which all can be promoted",
	async (props: {
		matchedChangelogFilenames: Array<string>
		matchedPackageJsonFilenames: Array<string>
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const originalContents = [
			dedent`
				= Apples Changelog


				== {url-github}[Unreleased]

				=== Added
				* A new shower mode: \`jet-stream\`.
			`,
			dedent`
				= Oranges Changelog


				== {url-github}[Unreleased]

				=== Fixed
				* Office chairs are now more comfortable.
				* Books on the shelf are now alphabetically sorted.

				=== Changed
				* The office is now open 24/7.


				== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/apples",
					"version": "1.0.12",
					"type": "module",
					"main": "dist/apples.js",
					"types": "dist/apples.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/oranges",
					"version": "1.0.12",
					"type": "module",
					"main": "dist/oranges.js",
					"types": "dist/oranges.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
		]

		const promotedContents = [
			dedent`
				= Apples Changelog


				== {url-github}/compare/v${props.releaseVersion}\\...HEAD[Unreleased]


				== {url-github}/releases/tag/v${props.releaseVersion}[${props.releaseVersion}] - ${props.releaseDate}

				=== Added
				* A new shower mode: \`jet-stream\`.
			`,
			dedent`
				= Oranges Changelog


				== {url-github}/compare/v${props.releaseVersion}\\...HEAD[Unreleased]


				== {url-github}/compare/v0.9.9\\...v${props.releaseVersion}[${props.releaseVersion}] - ${props.releaseDate}

				=== Fixed
				* Office chairs are now more comfortable.
				* Books on the shelf are now alphabetically sorted.

				=== Changed
				* The office is now open 24/7.


				== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/apples",
					"version": "${props.releaseVersion}",
					"type": "module",
					"main": "dist/apples.js",
					"types": "dist/apples.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/oranges",
					"version": "${props.releaseVersion}",
					"type": "module",
					"main": "dist/oranges.js",
					"types": "dist/oranges.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockReturnValue(props.releaseDate)
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[2],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: originalContents[3],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedChangelogFilenames,
				...props.matchedPackageJsonFilenames,
				"--release-version",
				props.releaseVersion,
			])
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog files and the promoted package.json files", () => {
			expect(writeFiles).toHaveBeenCalledWith([
				{
					content: promotedContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: promotedContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: promotedContents[2],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: promotedContents[3],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
			] satisfies Files)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageJsonFilenames
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}
`(
	"when $matchedChangelogFilenames matches changelog files of which one cannot be promoted and $matchedPackageJsonFilenames matches package.json files of which all can be promoted",
	async (props: {
		matchedChangelogFilenames: Array<string>
		matchedPackageJsonFilenames: Array<string>
	}) => {
		const originalContents = [
			dedent`
				= Changelog


				== {url-github}[Unreleased]

				=== Added
				* A new shower mode: \`jet-stream\`.
			`,
			dedent`
				= Releases


				== {url-github}[Unreleased]


				== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/apples",
					"version": "1.0.12",
					"type": "module",
					"main": "dist/apples.js",
					"types": "dist/apples.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
			dedent`
				{
					"$schema": "https://json.schemastore.org/package.json",
					"name": "@rainstormy/oranges",
					"version": "1.0.12",
					"type": "module",
					"main": "dist/oranges.js",
					"types": "dist/oranges.d.ts",
					"files": ["dist"],
					"packageManager": "yarn@4.0.1"
				}
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[2],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: originalContents[3],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedChangelogFilenames,
				...props.matchedPackageJsonFilenames,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedChangelogFilenames[1]} must have at least one item in the 'Unreleased' section.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageJsonFilenames
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}
`(
	"when $matchedChangelogFilenames matches changelog files of which all can be promoted and $matchedPackageJsonFilenames matches package.json files of which one cannot be promoted",
	async (props: {
		matchedChangelogFilenames: Array<string>
		matchedPackageJsonFilenames: Array<string>
	}) => {
		const originalContents = [
			dedent`
				= Apples Changelog


				== {url-github}[Unreleased]

				=== Added
				* A new shower mode: \`jet-stream\`.
			`,
			dedent`
				= Oranges Changelog


				== {url-github}[Unreleased]

				=== Fixed
				* Office chairs are now more comfortable.
				* Books on the shelf are now alphabetically sorted.

				=== Changed
				* The office is now open 24/7.


				== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.
			`,
			dedent`
				{
					"private": true,
				}
			`,
			dedent`
				{
					"name": "@rainstormy/oranges",
					"version": "0.5.0",
				}
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilenames[0],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedChangelogFilenames[1],
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[2],
					path: props.matchedPackageJsonFilenames[0],
					type: "package-json",
				},
				{
					content: originalContents[3],
					path: props.matchedPackageJsonFilenames[1],
					type: "package-json",
				},
			])

			actualExitCode = await mainProgram([
				"--files",
				...props.matchedChangelogFilenames,
				...props.matchedPackageJsonFilenames,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(
				`${props.matchedPackageJsonFilenames[0]} must have a 'version' field.`,
			)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedUnsupportedFilename
	${"CHANGELOG.md"}
	${"packages/apples/tasks.json"}
`(
	"when $matchedUnsupportedFilename matches a file of an unsupported format",
	async (props: { matchedUnsupportedFilename: string }) => {
		const errorMessage = `${props.matchedUnsupportedFilename} is not a supported file format.`

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => {
				throw new Error(errorMessage)
			})

			actualExitCode = await mainProgram([
				"--files",
				props.matchedUnsupportedFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(errorMessage)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | matchedUnsupportedFilename
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"CHANGELOG.md"}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"packages/apples/tasks.json"}
`(
	"when $matchedChangelogFilename matches a changelog file that can be promoted and $matchedPackageJsonFilename matches a package.json file that can be promoted and $matchedUnsupportedFilename matches a file of an unsupported format",
	async (props: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		matchedUnsupportedFilename: string
	}) => {
		const errorMessage = `${props.matchedUnsupportedFilename} is not a supported file format.`

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => {
				throw new Error(errorMessage)
			})

			actualExitCode = await mainProgram([
				"--files",
				props.matchedChangelogFilename,
				props.matchedPackageJsonFilename,
				props.matchedUnsupportedFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(errorMessage)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | errorMessage
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"Failed to read CHANGELOG.adoc: Permission denied."}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"Failed to read lib/package.json: File already in use."}
`(
	"when a file cannot be read",
	async (props: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		errorMessage: string
	}) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => {
				throw new Error(props.errorMessage)
			})

			actualExitCode = await mainProgram([
				"--files",
				props.matchedChangelogFilename,
				props.matchedPackageJsonFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(props.errorMessage)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | errorMessage
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"Failed to write changes to CHANGELOG.adoc: Permission denied."}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"Failed to write changes to lib/package.json: File already in use."}
`(
	"when the changes to a file cannot be saved",
	async (props: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		errorMessage: string
	}) => {
		const originalContents = [
			dedent`
				= Changelog


				== {url-repo}[Unreleased]

				=== Changed
				* The fruit basket is now refilled every day.
			`,
			dedent`
				{
					"name": "@rainstormy/preset-prettier-base",
					"version": "0.8.6",
				}
			`,
		]

		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			today.mockImplementation(() => "2022-05-29")
			readMatchingFiles.mockImplementation(async () => [
				{
					content: originalContents[0],
					path: props.matchedChangelogFilename,
					type: "asciidoc-changelog",
				},
				{
					content: originalContents[1],
					path: props.matchedPackageJsonFilename,
					type: "package-json",
				},
			])
			writeFiles.mockImplementation(async () => {
				throw new Error(props.errorMessage)
			})

			actualExitCode = await mainProgram([
				"--files",
				props.matchedChangelogFilename,
				props.matchedPackageJsonFilename,
				"--release-version",
				"2.0.0",
			])
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printError).toHaveBeenCalledWith(props.errorMessage)
			expect(printError).toHaveBeenCalledTimes(1)
		})
	},
)
