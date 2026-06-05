import { usageInstructions } from "#program/cli/UsageInstructions.ts"
import { program } from "#program/Program.ts"
import { EXIT_CODE_SUCCESS, type ExitCode } from "#utilities/ExitCode.ts"
import { printMessage } from "#utilities/logging/Logger.ts"

export async function cliProgram(args: Array<string>): Promise<ExitCode> {
	if (args.length === 0 || args.includes("--help")) {
		printMessage(usageInstructions())
		return EXIT_CODE_SUCCESS
	}
	if (args.includes("--version")) {
		printMessage(import.meta.env.UPDRAFT_VERSION)
		return EXIT_CODE_SUCCESS
	}
	return program(args, "\nFor usage instructions, please run the program with the --help option.")
}
