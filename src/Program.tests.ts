import { type OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import {
	fakeReadingMatchingFiles,
	type OnReadingMatchingFiles,
} from "+adapters/OnReadingMatchingFiles"
import {
	fakeWritingToFiles,
	type OnWritingToFiles,
} from "+adapters/OnWritingToFiles"
import { type ExitCode } from "+utilities/ExitCode"
import { type Release } from "+utilities/Release"
import { dedent } from "+utilities/string-transformations"
import { describe, expect, it, vi } from "vitest"
import { type Configuration } from "./Configuration"
import { runProgram, usageInstructions } from "./Program"

describe("the usage instructions", () => {
	it("is a list of program arguments and options", () => {
		expect(usageInstructions).toBe(dedent`
			Usage: release <semantic-version> [options]

			This tool prepares a new release by updating certain files accordingly.

			  <semantic-version>  The semantic version of the new release.
			                      Mandatory except for --help and --version.
			                      Format: major.minor.patch[-prerelease][+buildinfo]

			Options:
			  --changelogs <patterns>  Update changelog files matching the glob patterns.
			                           Supported formats: AsciiDoc (*.adoc).

			  --help                   Display this help screen and exit.

			  --packages <patterns>    Update package.json files matching the glob patterns.

			  --version                Display the version of this tool and exit.
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
	configuration                                                                | expectedExitCode | expectedSeverity | expectedMessage
	${{ type: "display-help-screen" }}                                           | ${0}             | ${"info"}        | ${usageInstructions}
	${{ type: "display-tool-version", toolVersion: "1.0.0" }}                    | ${0}             | ${"info"}        | ${"1.0.0"}
	${{ type: "display-tool-version", toolVersion: "2.1.0-beta.1" }}             | ${0}             | ${"info"}        | ${"2.1.0-beta.1"}
	${{ type: "error-release-version-missing" }}                                 | ${2}             | ${"error"}       | ${"Expected the first argument to be the semantic version of the new release.\nFor usage instructions, run the program with the --help option."}
	${{ type: "error-release-version-invalid", providedReleaseVersion: "next" }} | ${2}             | ${"error"}       | ${"Expected the first argument to be a valid semantic version number, but was 'next'.\nFor usage instructions, run the program with the --help option."}
	${{ type: "error-release-version-invalid", providedReleaseVersion: "2.5" }}  | ${2}             | ${"error"}       | ${"Expected the first argument to be a valid semantic version number, but was '2.5'.\nFor usage instructions, run the program with the --help option."}
	${{ type: "error-changelog-file-pattern-missing" }}                          | ${2}             | ${"error"}       | ${"Expected one or more glob patterns to follow the --changelogs option.\nFor usage instructions, run the program with the --help option."}
	${{ type: "error-package-file-pattern-missing" }}                            | ${2}             | ${"error"}       | ${"Expected one or more glob patterns to follow the --packages option.\nFor usage instructions, run the program with the --help option."}
`(
	"when the configuration is $configuration.type (%#)",
	(input: {
		readonly configuration: Configuration
		readonly expectedExitCode: ExitCode
		readonly expectedSeverity: OnDisplayingMessage.Severity
		readonly expectedMessage: string
	}) => {
		const {
			configuration,
			expectedExitCode,
			expectedSeverity,
			expectedMessage,
		} = input

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onReadingMatchingFiles: OnReadingMatchingFiles = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{ configuration },
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it(`returns an exit code of ${expectedExitCode}`, () => {
				expect(exitCode).toBe(expectedExitCode)
			})

			it(`displays ${
				expectedSeverity === "info" ? "a message" : "an error"
			}`, () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					severity: expectedSeverity,
					message: expectedMessage,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
			})

			it("does not read the content of any file", () => {
				expect(onReadingMatchingFiles).not.toHaveBeenCalled()
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

const dummyRelease: Release = { version: "2.0.0", date: "2023-04-19" }

describe.each`
	changelogGlobPatterns                      | packageGlobPatterns                                  | expectedChangelogWarning                                        | expectedPackageWarning
	${["CHANGELOG.adoc"]}                      | ${["package.json"]}                                  | ${"CHANGELOG.adoc did not match any files."}                    | ${"package.json did not match any files."}
	${["CHANGELOG.adoc", "lib/RELEASES.adoc"]} | ${["packages/**/package.json", "dist/package.json"]} | ${"CHANGELOG.adoc, lib/RELEASES.adoc did not match any files."} | ${"packages/**/package.json, dist/package.json did not match any files."}
`(
	"when $changelogGlobPatterns and $packageGlobPatterns do not match any changelog or package files",
	(input: {
		readonly changelogGlobPatterns: ReadonlyArray<string>
		readonly packageGlobPatterns: ReadonlyArray<string>
		readonly expectedChangelogWarning: string
		readonly expectedPackageWarning: string
	}) => {
		const {
			changelogGlobPatterns,
			packageGlobPatterns,
			expectedChangelogWarning,
			expectedPackageWarning,
		} = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			/* No matched files. */
		])

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns,
						packageGlobPatterns,
						newRelease: dummyRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("displays two warnings", () => {
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(1, {
					severity: "warning",
					message: expectedChangelogWarning,
				})
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(2, {
					severity: "warning",
					message: expectedPackageWarning,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(2)
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	matchedChangelogFilename | newRelease
	${"CHANGELOG.adoc"}      | ${{ version: "1.4.11", date: "2023-10-26" }}
	${"lib/RELEASES.adoc"}   | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }}
`(
	"when $matchedChangelogFilename is a changelog that can be promoted and no package glob patterns have been specified",
	(input: {
		readonly matchedChangelogFilename: string
		readonly newRelease: Release
	}) => {
		const { matchedChangelogFilename, newRelease } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [matchedChangelogFilename],
						packageGlobPatterns: [],
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("remains silent", () => {
				expect(onDisplayingMessage).not.toHaveBeenCalled()
			})

			it("saves the promoted changelog", () => {
				expect(onWritingToFiles).toHaveBeenCalledWith({
					outputPathsWithContent: [
						[
							matchedChangelogFilename,
							dedent`
								= Changelog


								== {url-repo}/compare/v${newRelease.version}\\...HEAD[Unreleased]


								== {url-repo}/releases/tag/v${newRelease.version}[${newRelease.version}] - ${newRelease.date}

								=== Changed
								* The fruit basket is now refilled every day.
							`,
						],
					],
				})
				expect(onWritingToFiles).toHaveBeenCalledTimes(1)
			})
		})
	},
)

describe.each`
	matchedChangelogFilename
	${"CHANGELOG.adoc"}
	${"lib/RELEASES.adoc"}
`(
	"when $matchedChangelogFilename is an empty changelog and no package glob patterns have been specified",
	(input: { readonly matchedChangelogFilename: string }) => {
		const { matchedChangelogFilename } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[matchedChangelogFilename, "" /* An empty file. */],
		])

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [matchedChangelogFilename],
						packageGlobPatterns: [],
						newRelease: dummyRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
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
		})
	},
)

describe.each`
	matchedChangelogFilename
	${"CHANGELOG.adoc"}
	${"lib/RELEASES.adoc"}
`(
	"when $matchedChangelogFilename is a changelog that cannot be promoted and no package glob patterns have been specified",
	(input: { readonly matchedChangelogFilename: string }) => {
		const { matchedChangelogFilename } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[
				matchedChangelogFilename,
				dedent`
					= Changelog

					== {url-repo}[Unreleased]
				`,
			],
		])

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [matchedChangelogFilename],
						packageGlobPatterns: [],
						newRelease: dummyRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
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
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                                                | packageGlobPatterns                             | newRelease                                         | expectedPackageWarning
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${["package.json"]}                             | ${{ version: "1.4.11", date: "2023-10-26" }}       | ${"package.json did not match any files."}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${["lib/package.json", "build/*-package.json"]} | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }} | ${"lib/package.json, build/*-package.json did not match any files."}
`(
	"when $matchedChangelogFilenames are changelogs that can be promoted and $packageGlobPatterns does not match any package files",
	(input: {
		readonly matchedChangelogFilenames: ReadonlyArray<string>
		readonly packageGlobPatterns: ReadonlyArray<string>
		readonly newRelease: Release
		readonly expectedPackageWarning: string
	}) => {
		const {
			matchedChangelogFilenames,
			packageGlobPatterns,
			newRelease,
			expectedPackageWarning,
		} = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: matchedChangelogFilenames,
						packageGlobPatterns,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("displays a warning", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					severity: "warning",
					message: expectedPackageWarning,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
			})

			it("saves the promoted changelogs", () => {
				expect(onWritingToFiles).toHaveBeenCalledWith({
					outputPathsWithContent: [
						[
							matchedChangelogFilenames[0],
							dedent`
								= Changelog


								== {url-github}/compare/v${newRelease.version}\\...HEAD[Unreleased]


								== {url-github}/releases/tag/v${newRelease.version}[${newRelease.version}] - ${newRelease.date}

								=== Added
								* A new shower mode: \`jet-stream\`.
							`,
						],
						[
							matchedChangelogFilenames[1],
							dedent`
								= Releases


								== {url-github}/compare/v${newRelease.version}\\...HEAD[Unreleased]


								== {url-github}/compare/v0.9.9\\...v${newRelease.version}[${newRelease.version}] - ${newRelease.date}

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


								== {url-github}/compare/v${newRelease.version}\\...HEAD[Unreleased]


								== {url-github}/releases/tag/v${newRelease.version}[${newRelease.version}] - ${newRelease.date}

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
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                                                | newRelease
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${{ version: "1.4.11", date: "2023-10-26" }}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }}
`(
	"when $matchedChangelogFilenames are changelogs of which one cannot be promoted and no package glob patterns have been specified",
	(input: {
		readonly matchedChangelogFilenames: ReadonlyArray<string>
		readonly newRelease: Release
	}) => {
		const { matchedChangelogFilenames, newRelease } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: matchedChangelogFilenames,
						packageGlobPatterns: [],
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
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
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                                                | packageGlobPatterns                             | newRelease                                         | expectedPackageWarning
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${["package.json"]}                             | ${{ version: "1.4.11", date: "2023-10-26" }}       | ${"package.json did not match any files."}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${["lib/package.json", "build/*-package.json"]} | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }} | ${"lib/package.json, build/*-package.json did not match any files."}
`(
	"when $matchedChangelogFilenames are changelogs of which one is empty and another one cannot be promoted and $packageGlobPatterns does not match any package files",
	(input: {
		readonly matchedChangelogFilenames: ReadonlyArray<string>
		readonly packageGlobPatterns: ReadonlyArray<string>
		readonly newRelease: Release
		readonly expectedPackageWarning: string
	}) => {
		const {
			matchedChangelogFilenames,
			packageGlobPatterns,
			newRelease,
			expectedPackageWarning,
		} = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: matchedChangelogFilenames,
						packageGlobPatterns,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 1", () => {
				expect(exitCode).toBe(1)
			})

			it("displays a warning and two errors", () => {
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(1, {
					severity: "warning",
					message: expectedPackageWarning,
				})
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(2, {
					severity: "error",
					message: `${matchedChangelogFilenames[1]} must have an 'Unreleased' section.`,
				})
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(3, {
					severity: "error",
					message: `${matchedChangelogFilenames[2]} must have at least one item in the 'Unreleased' section.`,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(3)
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	matchedPackageFilename | newRelease
	${"package.json"}      | ${{ version: "1.4.11", date: "2023-10-26" }}
	${"lib/package.json"}  | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }}
`(
	"when $matchedPackageFilename is a package that can be promoted and no changelog glob patterns have been specified",
	(input: {
		readonly matchedPackageFilename: string
		readonly newRelease: Release
	}) => {
		const { matchedPackageFilename, newRelease } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[
				matchedPackageFilename,
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [],
						packageGlobPatterns: [matchedPackageFilename],
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("remains silent", () => {
				expect(onDisplayingMessage).not.toHaveBeenCalled()
			})

			it("saves the promoted package", () => {
				expect(onWritingToFiles).toHaveBeenCalledWith({
					outputPathsWithContent: [
						[
							matchedPackageFilename,
							dedent`
								{
									"$schema": "https://json.schemastore.org/package.json",
									"name": "@rainstormy/preset-prettier-base",
									"version": "${newRelease.version}",
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
		})
	},
)

describe.each`
	matchedPackageFilename
	${"package.json"}
	${"lib/package.json"}
`(
	"when $matchedPackageFilename is an empty package and no changelog glob patterns have been specified",
	(input: { readonly matchedPackageFilename: string }) => {
		const { matchedPackageFilename } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[matchedPackageFilename, "" /* An empty file. */],
		])

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [],
						packageGlobPatterns: [matchedPackageFilename],
						newRelease: dummyRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 1", () => {
				expect(exitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					severity: "error",
					message: `${matchedPackageFilename} must have a 'version' field.`,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	matchedPackageFilename
	${"package.json"}
	${"lib/package.json"}
`(
	"when $matchedPackageFilename is a package that cannot be promoted and no changelog glob patterns have been specified",
	(input: { readonly matchedPackageFilename: string }) => {
		const { matchedPackageFilename } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[
				matchedPackageFilename,
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

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [],
						packageGlobPatterns: [matchedPackageFilename],
						newRelease: dummyRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 1", () => {
				expect(exitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					severity: "error",
					message: `${matchedPackageFilename} must have a 'version' field.`,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	matchedPackageFilenames                                                                               | changelogGlobPatterns                      | newRelease                                         | expectedChangelogWarning
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${["CHANGELOG.adoc"]}                      | ${{ version: "1.4.11", date: "2023-10-26" }}       | ${"CHANGELOG.adoc did not match any files."}
	${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${["lib/RELEASES.adoc", "*.CHANGES.adoc"]} | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }} | ${"lib/RELEASES.adoc, *.CHANGES.adoc did not match any files."}
`(
	"when $matchedPackageFilenames are packages that can be promoted and $changelogGlobPatterns does not match any changelog files",
	(input: {
		readonly matchedPackageFilenames: ReadonlyArray<string>
		readonly changelogGlobPatterns: ReadonlyArray<string>
		readonly newRelease: Release
		readonly expectedChangelogWarning: string
	}) => {
		const {
			matchedPackageFilenames,
			changelogGlobPatterns,
			newRelease,
			expectedChangelogWarning,
		} = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[
				matchedPackageFilenames[0],
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
				matchedPackageFilenames[1],
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
				matchedPackageFilenames[2],
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns,
						packageGlobPatterns: matchedPackageFilenames,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("displays a warning", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					severity: "warning",
					message: expectedChangelogWarning,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
			})

			it("saves the promoted packages", () => {
				expect(onWritingToFiles).toHaveBeenCalledWith({
					outputPathsWithContent: [
						[
							matchedPackageFilenames[0],
							dedent`
								{
									"$schema": "https://json.schemastore.org/package.json",
									"name": "@rainstormy/apples",
									"version": "${newRelease.version}",
									"type": "module",
									"main": "dist/apples.js",
									"types": "dist/apples.d.ts",
									"files": ["dist"],
									"packageManager": "yarn@4.0.1"
								}
							`,
						],
						[
							matchedPackageFilenames[1],
							dedent`
								{
									"$schema": "https://json.schemastore.org/package.json",
									"name": "@rainstormy/oranges",
									"version": "${newRelease.version}",
									"type": "module",
									"main": "dist/oranges.js",
									"types": "dist/oranges.d.ts",
									"files": ["dist"],
									"packageManager": "yarn@4.0.1"
								}
							`,
						],
						[
							matchedPackageFilenames[2],
							dedent`
								{
									"$schema": "https://json.schemastore.org/package.json",
									"name": "@rainstormy/peaches",
									"version": "${newRelease.version}",
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
		})
	},
)

describe.each`
	matchedPackageFilenames                                                                               | newRelease
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${{ version: "1.4.11", date: "2023-10-26" }}
	${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }}
`(
	"when $matchedPackageFilenames are packages of which one cannot be promoted and no changelog glob patterns have been specified",
	(input: {
		readonly matchedPackageFilenames: ReadonlyArray<string>
		readonly newRelease: Release
	}) => {
		const { matchedPackageFilenames, newRelease } = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[
				matchedPackageFilenames[0],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/apples",
						"version": "0.9.1",
					}
				`,
			],
			[
				matchedPackageFilenames[1],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/oranges",
						"version": "0.9.1",
					}
				`,
			],
			[
				matchedPackageFilenames[2],
				dedent`
					{
						"private": true,
						"type": "module",
						"packageManager": "yarn@3.6.3"
					}
				`,
			],
		])

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [],
						packageGlobPatterns: matchedPackageFilenames,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 1", () => {
				expect(exitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					severity: "error",
					message: `${matchedPackageFilenames[2]} must have a 'version' field.`,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	matchedPackageFilenames                                                                               | changelogGlobPatterns                      | newRelease                                         | expectedChangelogWarning
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${["CHANGELOG.adoc"]}                      | ${{ version: "1.4.11", date: "2023-10-26" }}       | ${"CHANGELOG.adoc did not match any files."}
	${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${["lib/RELEASES.adoc", "*.CHANGES.adoc"]} | ${{ version: "5.0.6-beta.2", date: "2024-06-12" }} | ${"lib/RELEASES.adoc, *.CHANGES.adoc did not match any files."}
`(
	"when $matchedPackageFilenames are packages of which one is empty and another one cannot be promoted and $changelogGlobPatterns does not match any changelog files",
	(input: {
		readonly matchedPackageFilenames: ReadonlyArray<string>
		readonly changelogGlobPatterns: ReadonlyArray<string>
		readonly newRelease: Release
		readonly expectedChangelogWarning: string
	}) => {
		const {
			matchedPackageFilenames,
			changelogGlobPatterns,
			newRelease,
			expectedChangelogWarning,
		} = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
			[
				matchedPackageFilenames[0],
				dedent`
					{
						"private": true,
					}
				`,
			],
			[matchedPackageFilenames[1], "" /* An empty file. */],
			[
				matchedPackageFilenames[2],
				dedent`
					{
						"name": "@rainstormy/peaches",
						"version": "0.5.0",
					}
				`,
			],
		])

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns,
						packageGlobPatterns: matchedPackageFilenames,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 1", () => {
				expect(exitCode).toBe(1)
			})

			it("displays a warning and two errors", () => {
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(1, {
					severity: "warning",
					message: expectedChangelogWarning,
				})
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(2, {
					severity: "error",
					message: `${matchedPackageFilenames[0]} must have a 'version' field.`,
				})
				expect(onDisplayingMessage).toHaveBeenNthCalledWith(3, {
					severity: "error",
					message: `${matchedPackageFilenames[1]} must have a 'version' field.`,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(3)
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageFilename | newRelease
	${"CHANGELOG.adoc"}      | ${"package.json"}      | ${{ version: "3.6.4", date: "2023-12-05" }}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}  | ${{ version: "7.0.8-rc.1", date: "2024-03-23" }}
`(
	"when $matchedChangelogFilename is a changelog that can be promoted and $matchedPackageFilename is a package that can be promoted",
	(input: {
		readonly matchedChangelogFilename: string
		readonly matchedPackageFilename: string
		readonly newRelease: Release
	}) => {
		const { matchedChangelogFilename, matchedPackageFilename, newRelease } =
			input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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
				matchedPackageFilename,
				dedent`
					{
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
					}
				`,
			],
		])

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [matchedChangelogFilename],
						packageGlobPatterns: [matchedPackageFilename],
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("remains silent", () => {
				expect(onDisplayingMessage).not.toHaveBeenCalled()
			})

			it("saves the promoted changelog and the promoted package", () => {
				expect(onWritingToFiles).toHaveBeenCalledWith({
					outputPathsWithContent: [
						[
							matchedChangelogFilename,
							dedent`
								= Changelog


								== {url-repo}/compare/v${newRelease.version}\\...HEAD[Unreleased]


								== {url-repo}/releases/tag/v${newRelease.version}[${newRelease.version}] - ${newRelease.date}

								=== Changed
								* The fruit basket is now refilled every day.
							`,
						],
						[
							matchedPackageFilename,
							dedent`
								{
									"name": "@rainstormy/preset-prettier-base",
									"version": "${newRelease.version}",
								}
							`,
						],
					],
				})
				expect(onWritingToFiles).toHaveBeenCalledTimes(1)
			})
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageFilenames                                              | newRelease
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]} | ${{ version: "3.6.4", date: "2023-12-05" }}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}                         | ${{ version: "7.0.8-rc.1", date: "2024-03-23" }}
`(
	"when $matchedChangelogFilenames are changelogs of which all can be promoted and $matchedPackageFilenames are packages of which all can be promoted",
	(input: {
		readonly matchedChangelogFilenames: ReadonlyArray<string>
		readonly matchedPackageFilenames: ReadonlyArray<string>
		readonly newRelease: Release
	}) => {
		const { matchedChangelogFilenames, matchedPackageFilenames, newRelease } =
			input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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
				matchedPackageFilenames[0],
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
				matchedPackageFilenames[1],
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: matchedChangelogFilenames,
						packageGlobPatterns: matchedPackageFilenames,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("remains silent", () => {
				expect(onDisplayingMessage).not.toHaveBeenCalled()
			})

			it("saves the promoted changelogs and the promoted packages", () => {
				expect(onWritingToFiles).toHaveBeenCalledWith({
					outputPathsWithContent: [
						[
							matchedChangelogFilenames[0],
							dedent`
								= Apples Changelog


								== {url-github}/compare/v${newRelease.version}\\...HEAD[Unreleased]


								== {url-github}/releases/tag/v${newRelease.version}[${newRelease.version}] - ${newRelease.date}

								=== Added
								* A new shower mode: \`jet-stream\`.
							`,
						],
						[
							matchedChangelogFilenames[1],
							dedent`
								= Oranges Changelog


								== {url-github}/compare/v${newRelease.version}\\...HEAD[Unreleased]


								== {url-github}/compare/v0.9.9\\...v${newRelease.version}[${newRelease.version}] - ${newRelease.date}

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
							matchedPackageFilenames[0],
							dedent`
								{
									"$schema": "https://json.schemastore.org/package.json",
									"name": "@rainstormy/apples",
									"version": "${newRelease.version}",
									"type": "module",
									"main": "dist/apples.js",
									"types": "dist/apples.d.ts",
									"files": ["dist"],
									"packageManager": "yarn@4.0.1"
								}
							`,
						],
						[
							matchedPackageFilenames[1],
							dedent`
								{
									"$schema": "https://json.schemastore.org/package.json",
									"name": "@rainstormy/oranges",
									"version": "${newRelease.version}",
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
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageFilenames                                              | newRelease
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]} | ${{ version: "3.6.4", date: "2023-12-05" }}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}                         | ${{ version: "7.0.8-rc.1", date: "2024-03-23" }}
`(
	"when $matchedChangelogFilenames are changelogs of which one cannot be promoted and $matchedPackageFilenames are packages of which all can be promoted",
	(input: {
		readonly matchedChangelogFilenames: ReadonlyArray<string>
		readonly matchedPackageFilenames: ReadonlyArray<string>
		readonly newRelease: Release
	}) => {
		const { matchedChangelogFilenames, matchedPackageFilenames, newRelease } =
			input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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
				matchedPackageFilenames[0],
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
				matchedPackageFilenames[1],
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

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: matchedChangelogFilenames,
						packageGlobPatterns: matchedPackageFilenames,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
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
		})
	},
)

describe.each`
	matchedChangelogFilenames                                                | matchedPackageFilenames                                              | newRelease
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/CHANGELOG.adoc"]} | ${["packages/apples/package.json", "packages/oranges/package.json"]} | ${{ version: "3.6.4", date: "2023-12-05" }}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc"]}                         | ${["lib/package.json", "dist/package.json"]}                         | ${{ version: "7.0.8-rc.1", date: "2024-03-23" }}
`(
	"when $matchedChangelogFilenames are changelogs of which all can be promoted and $matchedPackageFilenames are packages of which one cannot be promoted",
	(input: {
		readonly matchedChangelogFilenames: ReadonlyArray<string>
		readonly matchedPackageFilenames: ReadonlyArray<string>
		readonly newRelease: Release
	}) => {
		const { matchedChangelogFilenames, matchedPackageFilenames, newRelease } =
			input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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
				matchedPackageFilenames[0],
				dedent`
					{
						"private": true,
					}
				`,
			],
			[
				matchedPackageFilenames[1],
				dedent`
					{
						"name": "@rainstormy/oranges",
						"version": "0.5.0",
					}
				`,
			],
		])

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: matchedChangelogFilenames,
						packageGlobPatterns: matchedPackageFilenames,
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
			)

			it("returns an exit code of 1", () => {
				expect(exitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					severity: "error",
					message: `${matchedPackageFilenames[0]} must have a 'version' field.`,
				})
				expect(onDisplayingMessage).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageFilename | newRelease                                       | sabotagedFilename     | sabotagedErrorMessage    | expectedErrorMessage
	${"CHANGELOG.adoc"}      | ${"package.json"}      | ${{ version: "3.6.4", date: "2023-12-05" }}      | ${"CHANGELOG.adoc"}   | ${"Permission denied"}   | ${"Failed to read CHANGELOG.adoc: Permission denied."}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}  | ${{ version: "7.0.8-rc.1", date: "2024-03-23" }} | ${"lib/package.json"} | ${"File already in use"} | ${"Failed to read lib/package.json: File already in use."}
`(
	"when $sabotagedFilename cannot be read",
	(input: {
		readonly matchedChangelogFilename: string
		readonly matchedPackageFilename: string
		readonly newRelease: Release
		readonly sabotagedFilename: string
		readonly sabotagedErrorMessage: string
		readonly expectedErrorMessage: string
	}) => {
		const {
			matchedChangelogFilename,
			matchedPackageFilename,
			newRelease,
			sabotagedFilename,
			sabotagedErrorMessage,
			expectedErrorMessage,
		} = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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
				matchedPackageFilename,
				dedent`
					{
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
					}
				`,
			],
		])

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [matchedChangelogFilename],
						packageGlobPatterns: [matchedPackageFilename],
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
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
		})
	},
)

describe.each`
	matchedChangelogFilename | matchedPackageFilename | newRelease                                       | sabotagedFilename     | sabotagedErrorMessage    | expectedErrorMessage
	${"CHANGELOG.adoc"}      | ${"package.json"}      | ${{ version: "3.6.4", date: "2023-12-05" }}      | ${"CHANGELOG.adoc"}   | ${"Permission denied"}   | ${"Failed to write changes to CHANGELOG.adoc: Permission denied."}
	${"lib/CHANGELOG.adoc"}  | ${"lib/package.json"}  | ${{ version: "7.0.8-rc.1", date: "2024-03-23" }} | ${"lib/package.json"} | ${"File already in use"} | ${"Failed to write changes to lib/package.json: File already in use."}
`(
	"when the changes to $sabotagedFilename cannot be saved",
	(input: {
		readonly matchedChangelogFilename: string
		readonly matchedPackageFilename: string
		readonly newRelease: Release
		readonly sabotagedFilename: string
		readonly sabotagedErrorMessage: string
		readonly expectedErrorMessage: string
	}) => {
		const {
			matchedChangelogFilename,
			matchedPackageFilename,
			newRelease,
			sabotagedFilename,
			sabotagedErrorMessage,
			expectedErrorMessage,
		} = input

		const onReadingMatchingFiles = fakeReadingMatchingFiles([
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
				matchedPackageFilename,
				dedent`
					{
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
					}
				`,
			],
		])

		const onWritingToFiles = fakeWritingToFiles([
			[sabotagedFilename, () => sabotagedErrorMessage],
		])

		describe(`running the program with a new release of ${newRelease.version} on ${newRelease.date}`, async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()

			const exitCode = await runProgram(
				{
					configuration: {
						type: "prepare-release",
						changelogGlobPatterns: [matchedChangelogFilename],
						packageGlobPatterns: [matchedPackageFilename],
						newRelease,
					},
				},
				{ onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles },
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
		})
	},
)
