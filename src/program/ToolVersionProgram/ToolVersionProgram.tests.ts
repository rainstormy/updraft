import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import type { Configuration } from "+configuration/Configuration"
import { mainProgram } from "+program/Program"
import type { SemanticVersionString } from "+utilities/StringUtilities"
import { describe, expect, it, vi } from "vitest"

const dummyInput = {
	today: "2022-05-29",
	toolVersion: "1.0.0",
} as const

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

		const exitCode = await mainProgram(
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
