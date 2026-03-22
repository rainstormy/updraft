import { mockUpdraftVersion } from "#utilities/version/UpdraftVersion.mocks.ts"
import { beforeEach, describe, expect, it } from "vitest"
import { readMatchingFiles, writeFiles } from "#adapters/FileSystem/FileSystem.ts"
import { printMessage } from "#adapters/Logger/Logger.ts"
import { updraftCliProgram } from "#program/UpdraftCliProgram.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"
import type { SemanticVersionString } from "#utilities/types/SemanticVersionString.ts"

describe.each`
	toolVersionArgs                               | toolVersion
	${["--version"]}                              | ${"1.1.5"}
	${["--release-version", "2.2", "--version"]}  | ${"10.4.1"}
	${["--files", "--version", "CHANGELOG.adoc"]} | ${"3.2.0-beta.1"}
`(
	"when the args are $toolVersionArgs and the tool version is $toolVersion",
	(props: { toolVersionArgs: Array<string>; toolVersion: SemanticVersionString }) => {
		let actualExitCode: ExitCode | null = null

		beforeEach(async () => {
			mockUpdraftVersion(props.toolVersion)
			actualExitCode = await updraftCliProgram(props.toolVersionArgs)
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
