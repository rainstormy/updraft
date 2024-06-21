// Mock injection imports must be at the top, separated from the regular imports by a blank line.
import { injectFileSystemMock } from "+adapters/FileSystem/FileSystem.mock"
import { injectLoggerMock } from "+adapters/Logger/Logger.mock"

import { mainProgram } from "+program/Program"
import { usageInstructions } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import type { ExitCode } from "+utilities/ErrorUtilities"
import { beforeEach, describe, expect, it } from "vitest"

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
			actualExitCode = await mainProgram(props.helpScreenArgs)
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("displays the usage instructions", () => {
			expect(printMessage).toHaveBeenCalledWith(usageInstructions)
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
