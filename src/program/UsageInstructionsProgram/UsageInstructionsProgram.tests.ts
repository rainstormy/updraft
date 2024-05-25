import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import { mainProgram } from "+program/Program"
import { usageInstructions } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import { describe, expect, it, vi } from "vitest"

describe.each`
	helpScreenArgs
	${[]}
	${["--help"]}
	${["--help", "--version"]}
	${["--release-version", "1.1", "--help"]}
	${["--files", "--help", "package.json"]}
`(
	"when the args are $helpScreenArgs",
	async (argsProps: { helpScreenArgs: Array<string> }) => {
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onListingMatchingFiles: OnListingMatchingFiles = vi.fn()
		const onReadingFiles: OnReadingFiles = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const exitCode = await mainProgram(
			{
				args: argsProps.helpScreenArgs,
				today: "2022-05-29",
				toolVersion: "1.0.0",
			},
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
	},
)
