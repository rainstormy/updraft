// Mock injection imports must be at the top, separated from the regular imports by a blank line.
import { injectFileSystemMock } from "+adapters/FileSystem/FileSystem.mock"
import { injectLoggerMock } from "+adapters/Logger/Logger.mock"

import { mainProgram } from "+program/Program"
import type { ExitCode } from "+utilities/ErrorUtilities"
import { dedent } from "+utilities/StringUtilities"
import { beforeEach, describe, expect, it } from "vitest"

const { printMessage, printWarning, printError } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

describe.each`
	invalidArgs                                                                                                               | expectedErrorMessage
	${["--file-patterns"]}                                                                                                    | ${"Unknown option '--file-patterns'"}
	${["--release"]}                                                                                                          | ${"Unknown option '--release'"}
	${["--check"]}                                                                                                            | ${"Unknown option '--check'"}
	${["--help", "--help"]}                                                                                                   | ${"--help cannot appear more than once"}
	${["--version", "--version"]}                                                                                             | ${"--version cannot appear more than once"}
	${["--files", "CHANGELOG.adoc"]}                                                                                          | ${"--release-version is required"}
	${["--files", "CHANGELOG.md", "--release-version"]}                                                                       | ${"--release-version requires a value"}
	${["--release-version", "1.1.0", "--release-version", "2.1.0"]}                                                           | ${"--release-version cannot appear more than once"}
	${["--files", "CHANGELOG.adoc", "--release-version", "1.0.1", "v1.0.2"]}                                                  | ${"--release-version cannot have more than one value"}
	${["--files", "CHANGELOG.md", "--release-version", "1.1"]}                                                                | ${"--release-version has an invalid value '1.1'"}
	${["--files", "CHANGELOG.adoc", "--release-version", "v2"]}                                                               | ${"--release-version has an invalid value 'v2'"}
	${["--files", "CHANGELOG.md", "--release-version", "next"]}                                                               | ${"--release-version has an invalid value 'next'"}
	${["--release-version", "1.0.1"]}                                                                                         | ${"--files, --release-files, or --prerelease-files is required"}
	${["--files", "--release-version", "1.0.1", "--prerelease-files", "CHANGELOG.adoc", "--release-files", "CHANGELOG.md"]}   | ${"--files requires a value"}
	${["--files", "packages/**/package.json", "packages/**/CHANGELOG.adoc", "--files", "CHANGELOG.md"]}                       | ${"--files cannot appear more than once"}
	${["--release-version", "1.0.1", "--prerelease-files", "--files", "package.json", "CHANGELOG.adoc"]}                      | ${"--prerelease-files requires a value"}
	${["--prerelease-files", "packages/**/package.json", "packages/**/CHANGELOG.adoc", "--prerelease-files", "CHANGELOG.md"]} | ${"--prerelease-files cannot appear more than once"}
	${["--release-version", "1.0.1", "--files", "package.json", "CHANGELOG.md", "--release-files"]}                           | ${"--release-files requires a value"}
	${["--release-files", "packages/**/package.json", "packages/**/CHANGELOG.adoc", "--release-files", "CHANGELOG.md"]}       | ${"--release-files cannot appear more than once"}
`(
	"when the args are $invalidArgs",
	(props: {
		invalidArgs: Array<string>
		expectedErrorMessage: string
	}) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			actualExitCode = await mainProgram(props.invalidArgs)
		})

		it("returns an exit code of 2", () => {
			expect(actualExitCode).toBe(2)
		})

		it(`displays an error message that says '${props.expectedErrorMessage}' and encourages the use of --help`, () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).toHaveBeenCalledWith(dedent`
				${props.expectedErrorMessage}.
				For usage instructions, please run the program with the --help option.
			`)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not read the content of any file", () => {
			expect(readMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)
