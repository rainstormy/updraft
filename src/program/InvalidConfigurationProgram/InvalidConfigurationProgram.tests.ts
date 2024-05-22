import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import type { Configuration } from "+configuration/Configuration"
import { mainProgram } from "+program/Program"
import { dedent } from "+utilities/StringUtilities"
import { describe, expect, it, vi } from "vitest"

const dummyInput = {
	today: "2022-05-29",
	toolVersion: "1.0.0",
} as const

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

		const exitCode = await mainProgram(
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
