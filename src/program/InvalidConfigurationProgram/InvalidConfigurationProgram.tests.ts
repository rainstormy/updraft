import { injectFileSystemMock } from "+adapters/FileSystem/FileSystem.mock"
import { injectLoggerMock } from "+adapters/Logger/Logger.mock"
import { mainProgram } from "+program/Program"
import type { ExitCode } from "+utilities/ErrorUtilities"
import { dedent } from "+utilities/StringUtilities"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { printError } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

beforeEach(() => {
	vi.clearAllMocks()
})

describe.each`
	invalidArgs                                                                                           | expectedErrorMessage
	${["--file-patterns"]}                                                                                | ${"Unknown option '--file-patterns'."}
	${["--release"]}                                                                                      | ${"Unknown option '--release'."}
	${["--check"]}                                                                                        | ${"Unknown option '--check'."}
	${["--help", "--help"]}                                                                               | ${"--help must be specified only once."}
	${["--version", "--version"]}                                                                         | ${"--version must be specified only once."}
	${["--release-version", "1.1.0", "--release-version", "2.1.0"]}                                       | ${"--release-version must be specified only once."}
	${["--files", "packages/**/package.json", "packages/**/CHANGELOG.adoc", "--files", "CHANGELOG.adoc"]} | ${"--files must be specified only once."}
	${["--files", "CHANGELOG.adoc"]}                                                                      | ${"--release-version must be specified."}
	${["--files", "CHANGELOG.adoc", "--release-version"]}                                                 | ${"--release-version must specify a value."}
	${["--files", "CHANGELOG.adoc", "--release-version", "1.0.1", "v1.0.2"]}                              | ${"--release-version must not specify more than one value."}
	${["--files", "CHANGELOG.adoc", "--release-version", "1.1"]}                                          | ${"--release-version has an invalid value '1.1'."}
	${["--files", "CHANGELOG.adoc", "--release-version", "v2"]}                                           | ${"--release-version has an invalid value 'v2'."}
	${["--files", "CHANGELOG.adoc", "--release-version", "next"]}                                         | ${"--release-version has an invalid value 'next'."}
	${["--release-version", "1.0.1"]}                                                                     | ${"--files must be specified."}
	${["--release-version", "1.0.1", "--files"]}                                                          | ${"--files must specify a value."}
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

		it("displays an appropriate error message and encourages the use of --help", () => {
			expect(printError).toHaveBeenCalledWith(dedent`
				${props.expectedErrorMessage}
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
