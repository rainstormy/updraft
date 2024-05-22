import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import type { Configuration } from "+configuration/Configuration"
import { mainProgram } from "+program/Program"
import { usageInstructions } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import { dedent } from "+utilities/StringUtilities"
import { describe, expect, it, vi } from "vitest"

const dummyInput = {
	today: "2022-05-29",
	toolVersion: "1.0.0",
} as const

describe("the program with a 'help-screen' configuration", async () => {
	const onDisplayingMessage: OnDisplayingMessage = vi.fn()
	const onListingMatchingFiles: OnListingMatchingFiles = vi.fn()
	const onReadingFiles: OnReadingFiles = vi.fn()
	const onWritingToFiles: OnWritingToFiles = vi.fn()

	const configuration: Configuration = {
		type: "help-screen",
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
