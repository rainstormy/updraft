import { injectFileSystemMock } from "+adapters/FileSystem/FileSystem.mock"
import { injectLoggerMock } from "+adapters/Logger/Logger.mock"
import { injectPackageJsonVersionMock } from "+adapters/PackageJsonVersion/PackageJsonVersion.mock"
import { mainProgram } from "+program/Program"
import type { ExitCode } from "+utilities/ErrorUtilities"
import type { SemanticVersionString } from "+utilities/StringUtilities"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { packageJsonVersion } = injectPackageJsonVersionMock()
const { printMessage } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

beforeEach(() => {
	vi.clearAllMocks()
})

describe.each`
	toolVersionArgs                               | toolVersion
	${["--version"]}                              | ${"1.1.5"}
	${["--release-version", "2.2", "--version"]}  | ${"10.4.1"}
	${["--files", "--version", "CHANGELOG.adoc"]} | ${"3.2.0-beta.1"}
`(
	"when the args are $toolVersionArgs and the tool version is $toolVersion",
	(props: {
		toolVersionArgs: Array<string>
		toolVersion: SemanticVersionString
	}) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			packageJsonVersion.mockImplementation(() => props.toolVersion)
			actualExitCode = await mainProgram(props.toolVersionArgs)
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("displays the tool version", () => {
			expect(printMessage).toHaveBeenCalledWith(props.toolVersion)
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
