import { printMessage } from "#adapters/Logger/Logger.ts"
import { usageInstructions } from "#program/cli/UsageInstructions.ts"
import { updraftProgram } from "#program/UpdraftProgram.ts"
import { EXIT_CODE_SUCCESS, type ExitCode } from "#utilities/ExitCode.ts"

export async function updraftCliProgram(args: Array<string>): Promise<ExitCode> {
	if (args.length === 0 || args.includes("--help")) {
		printMessage(usageInstructions())
		return EXIT_CODE_SUCCESS
	}
	if (args.includes("--version")) {
		printMessage(import.meta.env.UPDRAFT_VERSION)
		return EXIT_CODE_SUCCESS
	}
	return updraftProgram(
		args,
		"\nFor usage instructions, please run the program with the --help option.",
	)
}
