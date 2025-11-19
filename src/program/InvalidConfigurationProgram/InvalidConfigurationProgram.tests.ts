import { injectFileSystemMock } from "#adapters/FileSystem/FileSystem.mocks.ts"
import { injectLoggerMock } from "#adapters/Logger/Logger.mocks.ts"
import { beforeEach, describe, expect, it } from "vitest"
import { updraftCliProgram } from "#program/UpdraftCliProgram.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"
import { dedent } from "#utilities/StringUtilities.ts"

const { printMessage, printWarning, printError } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

describe.each`
	invalidArgs                                                                                                             | expectedError
	${["--file-patterns"]}                                                                                                  | ${"Unknown option '--file-patterns'."}
	${["--release"]}                                                                                                        | ${"Unknown option '--release'."}
	${["--check"]}                                                                                                          | ${"Unknown option '--check'."}
	${["--files", "CHANGELOG.adoc"]}                                                                                        | ${"--release-version is required."}
	${["--files", "CHANGELOG.md", "--release-version"]}                                                                     | ${"--release-version requires 1 argument, but got 0."}
	${["--release-version", "1.1.0", "--release-version", "2.1.0"]}                                                         | ${"--release-version requires 1 argument, but got 2."}
	${["--files", "CHANGELOG.adoc", "--release-version", "1.0.1", "v1.0.2"]}                                                | ${"--release-version requires 1 argument, but got 2."}
	${["--files", "CHANGELOG.md", "--release-version", "1.1"]}                                                              | ${"--release-version has an invalid value '1.1'."}
	${["--files", "CHANGELOG.adoc", "--release-version", "v2"]}                                                             | ${"--release-version has an invalid value 'v2'."}
	${["--files", "CHANGELOG.md", "--release-version", "next"]}                                                             | ${"--release-version has an invalid value 'next'."}
	${["--release-version", "1.0.1"]}                                                                                       | ${"--files, --release-files, or --prerelease-files is required."}
	${["--files", "--release-version", "1.0.1", "--prerelease-files", "CHANGELOG.adoc", "--release-files", "CHANGELOG.md"]} | ${"--files requires at least 1 argument, but got 0."}
	${["--release-version", "1.0.1", "--prerelease-files", "--files", "package.json", "CHANGELOG.adoc"]}                    | ${"--prerelease-files requires at least 1 argument, but got 0."}
	${["--release-version", "1.0.1", "--files", "package.json", "CHANGELOG.md", "--release-files"]}                         | ${"--release-files requires at least 1 argument, but got 0."}
`(
	"when the args are $invalidArgs",
	(props: { invalidArgs: Array<string>; expectedError: string }) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			actualExitCode = await updraftCliProgram(props.invalidArgs)
		})

		it("returns an exit code of 2", () => {
			expect(actualExitCode).toBe(2)
		})

		it("displays an error message and encourages the use of --help", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).toHaveBeenCalledWith(dedent`
				${props.expectedError}
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
