import { mockUpdraftVersion } from "#utilities/version/UpdraftVersion.mocks.ts"
import { beforeEach, describe, expect, it } from "vitest"
import { cliProgram } from "#program/cli/CliProgram.ts"
import { usageInstructions } from "#program/cli/UsageInstructions.ts"
import { EXIT_CODE_SUCCESS, type ExitCode } from "#types/ExitCode.ts"
import type { SemanticVersionString } from "#types/SemanticVersionString.ts"
import { readMatchingFiles, writeFiles } from "#utilities/files/FileSystem.ts"
import { printMessage } from "#utilities/logging/Logger.ts"

describe.each`
	helpScreenArgs
	${[]}
	${["--help"]}
	${["--help", "--version"]}
	${["--release-version", "1.1", "--help"]}
	${["--files", "--help", "package.json"]}
`("when the args are $helpScreenArgs", (props: { helpScreenArgs: Array<string> }) => {
	let actualExitCode: ExitCode | null = null

	beforeEach(async () => {
		actualExitCode = await cliProgram(props.helpScreenArgs)
	})

	it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
		expect(actualExitCode).toBe(EXIT_CODE_SUCCESS)
	})

	it("displays the usage instructions", () => {
		expect(printMessage).toHaveBeenCalledWith(usageInstructions())
		expect(printMessage).toHaveBeenCalledTimes(1)
	})

	it("does not read the content of any file", () => {
		expect(readMatchingFiles).not.toHaveBeenCalled()
	})

	it("does not write changes to any file", () => {
		expect(writeFiles).not.toHaveBeenCalled()
	})
})

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
			actualExitCode = await cliProgram(props.toolVersionArgs)
		})

		it(`exits with ${EXIT_CODE_SUCCESS}`, () => {
			expect(actualExitCode).toBe(EXIT_CODE_SUCCESS)
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
