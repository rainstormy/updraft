import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import {
	type OnListingMatchingFiles,
	onListingFakeMatchingFiles,
} from "+adapters/OnListingMatchingFiles"
import {
	type OnReadingFiles,
	onReadingFakeFiles,
} from "+adapters/OnReadingFiles"
import {
	type OnWritingToFiles,
	onWritingToFakeFiles,
} from "+adapters/OnWritingToFiles"
import type { Configuration } from "+configuration/Configuration"
import { runProgram, usageInstructions } from "+program/Program"
import {
	type DateString,
	type SemanticVersionString,
	dedent,
} from "+utilities/StringUtilities"
import { describe, expect, it, vi } from "vitest"

const dummyInput = {
	today: "2022-05-29",
	toolVersion: "1.0.0",
} as const

const dummyReleaseVersion: SemanticVersionString = "2.0.0"

describe("the program with a 'help-screen' configuration", async () => {
	const onDisplayingMessage: OnDisplayingMessage = vi.fn()
	const onListingMatchingFiles: OnListingMatchingFiles = vi.fn()
	const onReadingFiles: OnReadingFiles = vi.fn()
	const onWritingToFiles: OnWritingToFiles = vi.fn()

	const configuration: Configuration = {
		type: "help-screen",
	}

	const exitCode = await runProgram(
		{ ...dummyInput, configuration },
		{
			onDisplayingMessage,
			onListingMatchingFiles,
			onReadingFiles,
			onWritingToFiles,
		},
	)

	it("returns an exit code of 0", () => {
		expect(exitCode).toBe(0)
	})

	it("displays the usage instructions", () => {
		expect(onDisplayingMessage).toHaveBeenCalledWith({
			severity: "info",
			message: usageInstructions,
		} satisfies OnDisplayingMessage.Payload)
		expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
	})

	it("does not traverse the file system", () => {
		expect(onListingMatchingFiles).not.toHaveBeenCalled()
	})

	it("does not read the content of any file", () => {
		expect(onReadingFiles).not.toHaveBeenCalled()
	})

	it("does not write changes to any file", () => {
		expect(onWritingToFiles).not.toHaveBeenCalled()
	})
})

describe("the usage instructions", () => {
	it("is a list of program arguments and options", () => {
		expect(usageInstructions).toBe(dedent`
			Usage: updraft [options]

			This tool prepares a repository for an upcoming release by updating changelogs
			and bumping version numbers in package.json files.

			Supported file formats:
			  * AsciiDoc-based changelogs (*.adoc) in Keep a Changelog format.
			  * package.json.

			Options:
			  --files <patterns>           Update files matching the glob patterns.
			                               Mandatory when --release-version is specified.

			                               Use whitespace to separate multiple patterns:
			                               <pattern-1> <pattern-2> <pattern-3>

			  --help                       Display this help screen and exit.

			  --release-version <version>  The semantic version of the upcoming release.
			                               Mandatory when --files is specified.

			                               Expected format (optional parts in brackets):
			                               [v]major.minor.patch[-prerelease][+buildinfo]

			  --version                    Display the version of this tool and exit.
		`)
	})

	it("fits within 80 columns", () => {
		const lines = usageInstructions.split("\n")

		for (const line of lines) {
			expect(line.length).toBeLessThanOrEqual(80)
		}
	})
})

describe.each`
	toolVersion
	${"1.1.5"}
	${"3.2.0-beta.1"}
`(
	"the program with a 'tool-version' configuration when the tool version is $toolVersion",
	async (input: { toolVersion: SemanticVersionString }) => {
		const { toolVersion } = input

		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onListingMatchingFiles: OnListingMatchingFiles = vi.fn()
		const onReadingFiles: OnReadingFiles = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "tool-version",
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration, toolVersion },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("displays the tool version", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "info",
				message: toolVersion,
			} satisfies OnDisplayingMessage.Payload)
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not traverse the file system", () => {
			expect(onListingMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not read the content of any file", () => {
			expect(onReadingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	errorMessage
	${"Unknown option '--check'."}
	${"--release-version has an invalid value '2.5'."}
	${"--files must specify a value."}
`(
	"the program with an 'invalid' configuration when the error message is $errorMessage",
	async (input: { errorMessage: string }) => {
		const { errorMessage } = input

		const onListingMatchingFiles: OnListingMatchingFiles = vi.fn()
		const onReadingFiles: OnReadingFiles = vi.fn()
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "invalid",
			errorMessage,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 2", () => {
			expect(exitCode).toBe(2)
		})

		it("displays the error and encourages the use of --help", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: dedent`
					${errorMessage}
					For usage instructions, please run the program with the --help option.
				`,
			} satisfies OnDisplayingMessage.Payload)
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not traverse the file system", () => {
			expect(onListingMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not read the content of any file", () => {
			expect(onReadingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	filePatterns                                      | expectedWarning
	${["CHANGELOG.adoc"]}                             | ${"CHANGELOG.adoc did not match any files."}
	${["package.json"]}                               | ${"package.json did not match any files."}
	${["CHANGELOG.adoc", "packages/**/package.json"]} | ${"CHANGELOG.adoc, packages/**/package.json did not match any files."}
	${["**/package.json", "**/*.adoc"]}               | ${"**/package.json, **/*.adoc did not match any files."}
`(
	"the program with a 'release' configuration when $filePatterns does not match any files",
	async (input: {
		filePatterns: Array<string>
		expectedWarning: string
	}) => {
		const { filePatterns, expectedWarning } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			/* No matched files. */
		])
		const onReadingFiles: OnReadingFiles = vi.fn()
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns,
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("displays a warning", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "warning",
				message: expectedWarning,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not read the content of any file", () => {
			expect(onReadingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | releaseVersion    | releaseDate
	${"CHANGELOG.adoc"}      | ${"1.4.11"}       | ${"2023-10-26"}
	${"lib/RELEASES.adoc"}   | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"the program with a 'release' configuration when $matchedChangelogFilename matches a changelog file that can be promoted",
	async (input: {
		matchedChangelogFilename: string
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const { matchedChangelogFilename, releaseVersion, releaseDate } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedChangelogFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilename,
				dedent`
					= Changelog


					== {url-repo}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedChangelogFilename],
			releaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration, today: releaseDate },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(onDisplayingMessage).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog file", () => {
			expect(onWritingToFiles).toHaveBeenCalledWith({
				outputPathsWithContent: [
					[
						matchedChangelogFilename,
						dedent`
							= Changelog


							== {url-repo}/compare/v${releaseVersion}\\...HEAD[Unreleased]


							== {url-repo}/releases/tag/v${releaseVersion}[${releaseVersion}] - ${releaseDate}

							=== Changed
							* The fruit basket is now refilled every day.
						`,
					],
				],
			})
			expect(onWritingToFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilename
	${"CHANGELOG.adoc"}
	${"lib/RELEASES.adoc"}
`(
	"the program with a 'release' configuration when $matchedChangelogFilename matches an empty changelog file",
	async (input: { matchedChangelogFilename: string }) => {
		const { matchedChangelogFilename } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedChangelogFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[matchedChangelogFilename, "" /* An empty file. */],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedChangelogFilename],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedChangelogFilename} must have an 'Unreleased' section.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename
	${"CHANGELOG.adoc"}
	${"lib/RELEASES.adoc"}
`(
	"the program with a 'release' configuration when $matchedChangelogFilename matches a changelog file that cannot be promoted",
	async (input: { matchedChangelogFilename: string }) => {
		const { matchedChangelogFilename } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedChangelogFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilename,
				dedent`
					= Changelog

					== {url-repo}[Unreleased]
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedChangelogFilename],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedChangelogFilename} must have at least one item in the 'Unreleased' section.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns       | unmatchedFilePatterns                 | matchedChangelogFilenames                                                                                | releaseVersion    | releaseDate
	${["packages/**/*.adoc"]} | ${["CHANGELOG.adoc", "package.json"]} | ${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${"1.4.11"}       | ${"2023-10-26"}
	${["*/CHANGELOG.adoc"]}   | ${["build/package.json"]}             | ${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"the program with a 'release' configuration when $matchedFilePatterns matches changelog files that can be promoted and $unmatchedFilePatterns does not match any files",
	async (input: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedChangelogFilenames: Array<string>
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const {
			matchedFilePatterns,
			unmatchedFilePatterns,
			matchedChangelogFilenames,
			releaseVersion,
			releaseDate,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles(
			matchedChangelogFilenames,
		)
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilenames[0],
				dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[
				matchedChangelogFilenames[1],
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
			],
			[
				matchedChangelogFilenames[2],
				dedent`
					= Changes


					== {url-github}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.

					=== Fixed
					* Milk in the refrigerator is now fresh.
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [...matchedFilePatterns, ...unmatchedFilePatterns],
			releaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration, today: releaseDate },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("remains silent", () => {
			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(onDisplayingMessage).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog files", () => {
			expect(onWritingToFiles).toHaveBeenCalledWith({
				outputPathsWithContent: [
					[
						matchedChangelogFilenames[0],
						dedent`
							= Changelog


							== {url-github}/compare/v${releaseVersion}\\...HEAD[Unreleased]


							== {url-github}/releases/tag/v${releaseVersion}[${releaseVersion}] - ${releaseDate}

							=== Added
							* A new shower mode: \`jet-stream\`.
						`,
					],
					[
						matchedChangelogFilenames[1],
						dedent`
							= Releases


							== {url-github}/compare/v${releaseVersion}\\...HEAD[Unreleased]


							== {url-github}/compare/v0.9.9\\...v${releaseVersion}[${releaseVersion}] - ${releaseDate}

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
					],
					[
						matchedChangelogFilenames[2],
						dedent`
							= Changes


							== {url-github}/compare/v${releaseVersion}\\...HEAD[Unreleased]


							== {url-github}/releases/tag/v${releaseVersion}[${releaseVersion}] - ${releaseDate}

							=== Changed
							* The fruit basket is now refilled every day.

							=== Fixed
							* Milk in the refrigerator is now fresh.
						`,
					],
				],
			})
			expect(onWritingToFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilenames
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}
`(
	"the program with a 'release' configuration when $matchedChangelogFilenames matches changelog files of which one cannot be promoted",
	async (input: {
		matchedChangelogFilenames: Array<string>
	}) => {
		const { matchedChangelogFilenames } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles(
			matchedChangelogFilenames,
		)
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilenames[0],
				dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[
				matchedChangelogFilenames[1],
				dedent`
					= Releases


					== {url-github}[Unreleased]


					== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

					=== Added
					* A new cold water dispenser.
					* Skylights in the ceiling.
				`,
			],
			[
				matchedChangelogFilenames[2],
				dedent`
					= Changes


					== {url-github}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.

					=== Fixed
					* Milk in the refrigerator is now fresh.
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: matchedChangelogFilenames,
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedChangelogFilenames[1]} must have at least one item in the 'Unreleased' section.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns       | unmatchedFilePatterns                 | matchedChangelogFilenames
	${["packages/**/*.adoc"]} | ${["CHANGELOG.adoc", "package.json"]} | ${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]}
	${["*/CHANGELOG.adoc"]}   | ${["lib/**/package.json"]}            | ${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}
`(
	"the program with a 'release' configuration when $matchedFilePatterns matches changelog files of which one is empty and another one cannot be promoted and $unmatchedFilePatterns does not match any files",
	async (input: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedChangelogFilenames: Array<string>
	}) => {
		const {
			matchedFilePatterns,
			unmatchedFilePatterns,
			matchedChangelogFilenames,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles(
			matchedChangelogFilenames,
		)
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilenames[0],
				dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[matchedChangelogFilenames[1], "" /* An empty file. */],
			[
				matchedChangelogFilenames[2],
				dedent`
					= Changes


					== {url-github}[Unreleased]
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [...matchedFilePatterns, ...unmatchedFilePatterns],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays two errors", () => {
			expect(onDisplayingMessage).toHaveBeenNthCalledWith(1, {
				severity: "error",
				message: `${matchedChangelogFilenames[1]} must have an 'Unreleased' section.`,
			})
			expect(onDisplayingMessage).toHaveBeenNthCalledWith(2, {
				severity: "error",
				message: `${matchedChangelogFilenames[2]} must have at least one item in the 'Unreleased' section.`,
			})
			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(onDisplayingMessage).toHaveBeenCalledTimes(2)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedPackageJsonFilename | releaseVersion    | releaseDate
	${"package.json"}          | ${"1.4.11"}       | ${"2023-10-26"}
	${"lib/package.json"}      | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"the program with a 'release' configuration when $matchedPackageJsonFilename matches a package.json file that can be promoted",
	async (input: {
		matchedPackageJsonFilename: string
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const { matchedPackageJsonFilename, releaseVersion, releaseDate } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedPackageJsonFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedPackageJsonFilename,
				dedent`
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
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedPackageJsonFilename],
			releaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration, today: releaseDate },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(onDisplayingMessage).not.toHaveBeenCalled()
		})

		it("saves the promoted package.json file", () => {
			expect(onWritingToFiles).toHaveBeenCalledWith({
				outputPathsWithContent: [
					[
						matchedPackageJsonFilename,
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/preset-prettier-base",
								"version": "${releaseVersion}",
								"type": "module",
								"main": "dist/prettier.config.js",
								"types": "dist/prettier.config.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@3.6.3"
							}
						`,
					],
				],
			})
			expect(onWritingToFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedPackageJsonFilename
	${"package.json"}
	${"lib/package.json"}
`(
	"the program with a 'release' configuration when $matchedPackageJsonFilename matches an empty package.json file",
	async (input: { matchedPackageJsonFilename: string }) => {
		const { matchedPackageJsonFilename } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedPackageJsonFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[matchedPackageJsonFilename, "" /* An empty file. */],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedPackageJsonFilename],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedPackageJsonFilename} must have a 'version' field.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedPackageJsonFilename
	${"package.json"}
	${"lib/package.json"}
`(
	"the program with a 'release' configuration when $matchedPackageJsonFilename matches a package.json file that cannot be promoted",
	async (input: { matchedPackageJsonFilename: string }) => {
		const { matchedPackageJsonFilename } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedPackageJsonFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedPackageJsonFilename,
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"private": true,
						"type": "module",
						"packageManager": "yarn@3.6.3"
					}
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedPackageJsonFilename],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedPackageJsonFilename} must have a 'version' field.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns             | unmatchedFilePatterns                             | matchedPackageJsonFilenames                                                                           | releaseVersion    | releaseDate
	${["packages/**/package.json"]} | ${["packages/**/CHANGELOG.adoc", "package.json"]} | ${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${"1.4.11"}       | ${"2023-10-26"}
	${["*/package.json"]}           | ${["*/CHANGESETS.adoc"]}                          | ${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"the program with a 'release' configuration when $matchedFilePatterns matches package.json files that can be promoted and $unmatchedFilePatterns does not match any files",
	async (input: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedPackageJsonFilenames: Array<string>
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const {
			matchedFilePatterns,
			unmatchedFilePatterns,
			matchedPackageJsonFilenames,
			releaseVersion,
			releaseDate,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles(
			matchedPackageJsonFilenames,
		)
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedPackageJsonFilenames[0],
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
			],
			[
				matchedPackageJsonFilenames[1],
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
			],
			[
				matchedPackageJsonFilenames[2],
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
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [...matchedFilePatterns, ...unmatchedFilePatterns],
			releaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration, today: releaseDate },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("remains silent", () => {
			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(onDisplayingMessage).not.toHaveBeenCalled()
		})

		it("saves the promoted package.json files", () => {
			expect(onWritingToFiles).toHaveBeenCalledWith({
				outputPathsWithContent: [
					[
						matchedPackageJsonFilenames[0],
						dedent`
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
						`,
					],
					[
						matchedPackageJsonFilenames[1],
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/oranges",
								"version": "${releaseVersion}",
								"type": "module",
								"main": "dist/oranges.js",
								"types": "dist/oranges.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@4.0.1"
							}
						`,
					],
					[
						matchedPackageJsonFilenames[2],
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/peaches",
								"version": "${releaseVersion}",
								"type": "module",
								"main": "dist/peaches.js",
								"types": "dist/peaches.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@4.0.1"
							}
						`,
					],
				],
			})
			expect(onWritingToFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedPackageJsonFilenames
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]}
	${["lib/package.json", "dist/package.json", "build/package.json"]}
`(
	"the program with a 'release' configuration when $matchedPackageJsonFilenames matches package.json files of which one cannot be promoted",
	async (input: {
		matchedPackageJsonFilenames: Array<string>
	}) => {
		const { matchedPackageJsonFilenames } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles(
			matchedPackageJsonFilenames,
		)
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedPackageJsonFilenames[0],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/apples",
						"version": "0.9.1",
					}
				`,
			],
			[
				matchedPackageJsonFilenames[1],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/oranges",
						"version": "0.9.1",
					}
				`,
			],
			[
				matchedPackageJsonFilenames[2],
				dedent`
					{
						"private": true,
						"type": "module",
						"packageManager": "yarn@3.6.3"
					}
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: matchedPackageJsonFilenames,
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedPackageJsonFilenames[2]} must have a 'version' field.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedFilePatterns             | unmatchedFilePatterns                             | matchedPackageJsonFilenames
	${["packages/**/package.json"]} | ${["packages/**/CHANGELOG.adoc", "package.json"]} | ${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]}
	${["*/package.json"]}           | ${["*/CHANGESETS.adoc"]}                          | ${["lib/package.json", "dist/package.json", "build/package.json"]}
`(
	"the program with a 'release' configuration when $matchedFilePatterns matches package.json files of which one is empty and another one cannot be promoted and $unmatchedFilePatterns does not match any files",
	async (input: {
		matchedFilePatterns: Array<string>
		unmatchedFilePatterns: Array<string>
		matchedPackageJsonFilenames: Array<string>
	}) => {
		const {
			matchedFilePatterns,
			unmatchedFilePatterns,
			matchedPackageJsonFilenames,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles(
			matchedPackageJsonFilenames,
		)
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedPackageJsonFilenames[0],
				dedent`
					{
						"private": true,
					}
				`,
			],
			[matchedPackageJsonFilenames[1], "" /* An empty file. */],
			[
				matchedPackageJsonFilenames[2],
				dedent`
					{
						"name": "@rainstormy/peaches",
						"version": "0.5.0",
					}
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [...matchedFilePatterns, ...unmatchedFilePatterns],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays two errors", () => {
			expect(onDisplayingMessage).toHaveBeenNthCalledWith(1, {
				severity: "error",
				message: `${matchedPackageJsonFilenames[0]} must have a 'version' field.`,
			})
			expect(onDisplayingMessage).toHaveBeenNthCalledWith(2, {
				severity: "error",
				message: `${matchedPackageJsonFilenames[1]} must have a 'version' field.`,
			})
			// It does not display any warning for the unmatched file patterns when there is at least one match among all file patterns.
			expect(onDisplayingMessage).toHaveBeenCalledTimes(2)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | releaseVersion  | releaseDate
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"3.6.4"}      | ${"2023-12-05"}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"7.0.8-rc.1"} | ${"2024-03-23"}
`(
	"the program with a 'release' configuration when $matchedChangelogFilename matches a changelog file that can be promoted and $matchedPackageJsonFilename matches a package.json file that can be promoted",
	async (input: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const {
			matchedChangelogFilename,
			matchedPackageJsonFilename,
			releaseVersion,
			releaseDate,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedChangelogFilename,
			matchedPackageJsonFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilename,
				dedent`
					= Changelog


					== {url-repo}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.
				`,
			],
			[
				matchedPackageJsonFilename,
				dedent`
					{
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
					}
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedChangelogFilename, matchedPackageJsonFilename],
			releaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration, today: releaseDate },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(onDisplayingMessage).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog file and the promoted package.json file", () => {
			expect(onWritingToFiles).toHaveBeenCalledWith({
				outputPathsWithContent: [
					[
						matchedChangelogFilename,
						dedent`
							= Changelog


							== {url-repo}/compare/v${releaseVersion}\\...HEAD[Unreleased]


							== {url-repo}/releases/tag/v${releaseVersion}[${releaseVersion}] - ${releaseDate}

							=== Changed
							* The fruit basket is now refilled every day.
						`,
					],
					[
						matchedPackageJsonFilename,
						dedent`
							{
								"name": "@rainstormy/preset-prettier-base",
								"version": "${releaseVersion}",
							}
						`,
					],
				],
			})
			expect(onWritingToFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageJsonFilenames                                          | releaseVersion  | releaseDate
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]} | ${"3.6.4"}      | ${"2023-12-05"}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}                         | ${"7.0.8-rc.1"} | ${"2024-03-23"}
`(
	"the program with a 'release' configuration when $matchedChangelogFilenames matches changelog files of which all can be promoted and $matchedPackageJsonFilenames matches package.json files of which all can be promoted",
	async (input: {
		matchedChangelogFilenames: Array<string>
		matchedPackageJsonFilenames: Array<string>
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const {
			matchedChangelogFilenames,
			matchedPackageJsonFilenames,
			releaseVersion,
			releaseDate,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			...matchedChangelogFilenames,
			...matchedPackageJsonFilenames,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilenames[0],
				dedent`
					= Apples Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[
				matchedChangelogFilenames[1],
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
			],
			[
				matchedPackageJsonFilenames[0],
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
			],
			[
				matchedPackageJsonFilenames[1],
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
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [
				...matchedChangelogFilenames,
				...matchedPackageJsonFilenames,
			],
			releaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration, today: releaseDate },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(onDisplayingMessage).not.toHaveBeenCalled()
		})

		it("saves the promoted changelog files and the promoted package.json files", () => {
			expect(onWritingToFiles).toHaveBeenCalledWith({
				outputPathsWithContent: [
					[
						matchedChangelogFilenames[0],
						dedent`
							= Apples Changelog


							== {url-github}/compare/v${releaseVersion}\\...HEAD[Unreleased]


							== {url-github}/releases/tag/v${releaseVersion}[${releaseVersion}] - ${releaseDate}

							=== Added
							* A new shower mode: \`jet-stream\`.
						`,
					],
					[
						matchedChangelogFilenames[1],
						dedent`
							= Oranges Changelog


							== {url-github}/compare/v${releaseVersion}\\...HEAD[Unreleased]


							== {url-github}/compare/v0.9.9\\...v${releaseVersion}[${releaseVersion}] - ${releaseDate}

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
					],
					[
						matchedPackageJsonFilenames[0],
						dedent`
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
						`,
					],
					[
						matchedPackageJsonFilenames[1],
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/oranges",
								"version": "${releaseVersion}",
								"type": "module",
								"main": "dist/oranges.js",
								"types": "dist/oranges.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@4.0.1"
							}
						`,
					],
				],
			})
			expect(onWritingToFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageJsonFilenames
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}
`(
	"the program with a 'release' configuration when $matchedChangelogFilenames matches changelog files of which one cannot be promoted and $matchedPackageJsonFilenames matches package.json files of which all can be promoted",
	async (input: {
		matchedChangelogFilenames: Array<string>
		matchedPackageJsonFilenames: Array<string>
	}) => {
		const { matchedChangelogFilenames, matchedPackageJsonFilenames } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			...matchedChangelogFilenames,
			...matchedPackageJsonFilenames,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilenames[0],
				dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[
				matchedChangelogFilenames[1],
				dedent`
					= Releases


					== {url-github}[Unreleased]


					== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

					=== Added
					* A new cold water dispenser.
					* Skylights in the ceiling.
				`,
			],
			[
				matchedPackageJsonFilenames[0],
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
			],
			[
				matchedPackageJsonFilenames[1],
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
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [
				...matchedChangelogFilenames,
				...matchedPackageJsonFilenames,
			],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedChangelogFilenames[1]} must have at least one item in the 'Unreleased' section.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageJsonFilenames
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}
`(
	"the program with a 'release' configuration when $matchedChangelogFilenames matches changelog files of which all can be promoted and $matchedPackageJsonFilenames matches package.json files of which one cannot be promoted",
	async (input: {
		matchedChangelogFilenames: Array<string>
		matchedPackageJsonFilenames: Array<string>
	}) => {
		const { matchedChangelogFilenames, matchedPackageJsonFilenames } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			...matchedChangelogFilenames,
			...matchedPackageJsonFilenames,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilenames[0],
				dedent`
					= Apples Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[
				matchedChangelogFilenames[1],
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
			],
			[
				matchedPackageJsonFilenames[0],
				dedent`
					{
						"private": true,
					}
				`,
			],
			[
				matchedPackageJsonFilenames[1],
				dedent`
					{
						"name": "@rainstormy/oranges",
						"version": "0.5.0",
					}
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [
				...matchedChangelogFilenames,
				...matchedPackageJsonFilenames,
			],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedPackageJsonFilenames[0]} must have a 'version' field.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedUnsupportedFilename
	${"CHANGELOG.md"}
	${"packages/apples/tasks.json"}
`(
	"the program with a 'release' configuration when $matchedUnsupportedFilename matches a file of an unsupported format",
	async (input: { matchedUnsupportedFilename: string }) => {
		const { matchedUnsupportedFilename } = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedUnsupportedFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[matchedUnsupportedFilename, "" /* An empty file. */],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedUnsupportedFilename],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedUnsupportedFilename} is not a supported file format.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | matchedUnsupportedFilename
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"CHANGELOG.md"}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"packages/apples/tasks.json"}
`(
	"the program with a 'release' configuration when $matchedChangelogFilename matches a changelog file that can be promoted and $matchedPackageJsonFilename matches a package.json file that can be promoted and $matchedUnsupportedFilename matches a file of an unsupported format",
	async (input: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		matchedUnsupportedFilename: string
	}) => {
		const {
			matchedChangelogFilename,
			matchedPackageJsonFilename,
			matchedUnsupportedFilename,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedChangelogFilename,
			matchedPackageJsonFilename,
			matchedUnsupportedFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilename,
				dedent`
					= Changelog


					== {url-repo}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.
				`,
			],
			[
				matchedPackageJsonFilename,
				dedent`
					{
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
					}
				`,
			],
			[matchedUnsupportedFilename, "" /* An empty file. */],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [
				matchedChangelogFilename,
				matchedPackageJsonFilename,
				matchedUnsupportedFilename,
			],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: `${matchedUnsupportedFilename} is not a supported file format.`,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | sabotagedFilename     | sabotagedErrorMessage    | expectedErrorMessage
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"CHANGELOG.adoc"}   | ${"Permission denied"}   | ${"Failed to read CHANGELOG.adoc: Permission denied."}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"lib/package.json"} | ${"File already in use"} | ${"Failed to read lib/package.json: File already in use."}
`(
	"the program with a 'release' configuration when $sabotagedFilename cannot be read",
	async (input: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		sabotagedFilename: string
		sabotagedErrorMessage: string
		expectedErrorMessage: string
	}) => {
		const {
			matchedChangelogFilename,
			matchedPackageJsonFilename,
			sabotagedFilename,
			sabotagedErrorMessage,
			expectedErrorMessage,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedChangelogFilename,
			matchedPackageJsonFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[sabotagedFilename, () => sabotagedErrorMessage],
			[
				matchedChangelogFilename,
				dedent`
					= Changelog


					== {url-repo}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.
				`,
			],
			[
				matchedPackageJsonFilename,
				dedent`
					{
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
					}
				`,
			],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedChangelogFilename, matchedPackageJsonFilename],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: expectedErrorMessage,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageJsonFilename | sabotagedFilename     | sabotagedErrorMessage    | expectedErrorMessage
	${"CHANGELOG.adoc"}      | ${"package.json"}          | ${"CHANGELOG.adoc"}   | ${"Permission denied"}   | ${"Failed to write changes to CHANGELOG.adoc: Permission denied."}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}      | ${"lib/package.json"} | ${"File already in use"} | ${"Failed to write changes to lib/package.json: File already in use."}
`(
	"the program with a 'release' configuration when the changes to $sabotagedFilename cannot be saved",
	async (input: {
		matchedChangelogFilename: string
		matchedPackageJsonFilename: string
		sabotagedFilename: string
		sabotagedErrorMessage: string
		expectedErrorMessage: string
	}) => {
		const {
			matchedChangelogFilename,
			matchedPackageJsonFilename,
			sabotagedFilename,
			sabotagedErrorMessage,
			expectedErrorMessage,
		} = input

		const onListingMatchingFiles = onListingFakeMatchingFiles([
			matchedChangelogFilename,
			matchedPackageJsonFilename,
		])
		const onReadingFiles = onReadingFakeFiles([
			[
				matchedChangelogFilename,
				dedent`
					= Changelog


					== {url-repo}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.
				`,
			],
			[
				matchedPackageJsonFilename,
				dedent`
					{
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
					}
				`,
			],
		])
		const onWritingToFiles = onWritingToFakeFiles([
			[sabotagedFilename, () => sabotagedErrorMessage],
		])
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()

		const configuration: Configuration = {
			type: "release",
			filePatterns: [matchedChangelogFilename, matchedPackageJsonFilename],
			releaseVersion: dummyReleaseVersion,
		}

		const exitCode = await runProgram(
			{ ...dummyInput, configuration },
			{
				onDisplayingMessage,
				onListingMatchingFiles,
				onReadingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 1", () => {
			expect(exitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				severity: "error",
				message: expectedErrorMessage,
			})
			expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
		})
	},
)
