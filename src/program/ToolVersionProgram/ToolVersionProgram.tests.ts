import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import { injectMocksOfPackageJsonVersion } from "+adapters/PackageJsonVersion/PackageJsonVersion.mocks"
import { mainProgram } from "+program/Program"
import type { SemanticVersionString } from "+utilities/StringUtilities"
import { describe, expect, it, vi } from "vitest"

const { mockPackageJsonVersion } = injectMocksOfPackageJsonVersion()

describe.each`
	toolVersionArgs
	${["--version"]}
	${["--release-version", "2.2", "--version"]}
	${["--files", "--version", "CHANGELOG.adoc"]}
`(
	"when the args are $toolVersionArgs",
	(argsProps: { toolVersionArgs: Array<string> }) => {
		describe.each`
			toolVersion
			${"1.1.5"}
			${"10.4.1"}
			${"3.2.0-beta.1"}
		`(
			"and the tool version is $toolVersion",
			async (toolVersionProps: { toolVersion: SemanticVersionString }) => {
				mockPackageJsonVersion(toolVersionProps.toolVersion)

				const onDisplayingMessage: OnDisplayingMessage = vi.fn()
				const onListingMatchingFiles: OnListingMatchingFiles = vi.fn()
				const onReadingFiles: OnReadingFiles = vi.fn()
				const onWritingToFiles: OnWritingToFiles = vi.fn()

				const exitCode = await mainProgram(argsProps.toolVersionArgs, {
					onDisplayingMessage,
					onListingMatchingFiles,
					onReadingFiles,
					onWritingToFiles,
				})

				it("returns an exit code of 0", () => {
					expect(exitCode).toBe(0)
				})

				it("displays the tool version", () => {
					expect(onDisplayingMessage).toHaveBeenCalledWith({
						severity: "info",
						message: toolVersionProps.toolVersion,
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
	},
)
