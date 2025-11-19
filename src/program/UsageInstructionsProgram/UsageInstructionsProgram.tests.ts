import { injectFileSystemMock } from "#adapters/FileSystem/FileSystem.mocks.ts"
import { injectLoggerMock } from "#adapters/Logger/Logger.mocks.ts"
import { beforeEach, describe, expect, it } from "vitest"
import { updraftCliProgram } from "#program/UpdraftCliProgram.ts"
import { getUsageInstructions } from "#program/UsageInstructionsProgram/UsageInstructionsProgram.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"

const { printMessage } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

describe.each`
	helpScreenArgs
	${[]}
	${["--help"]}
	${["--help", "--version"]}
	${["--release-version", "1.1", "--help"]}
	${["--files", "--help", "package.json"]}
`(
	"when the args are $helpScreenArgs",
	(props: { helpScreenArgs: Array<string> }) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			actualExitCode = await updraftCliProgram(props.helpScreenArgs)
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("displays the usage instructions", () => {
			expect(printMessage).toHaveBeenCalledWith(getUsageInstructions())
			expect(printMessage).toHaveBeenCalledTimes(1)
		})

		it("does not read the content of any file", () => {
			expect(readMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)
