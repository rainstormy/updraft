import { toolVersionProgram } from "#program/ToolVersionProgram/ToolVersionProgram.ts"
import { updraftProgram } from "#program/UpdraftProgram.ts"
import { usageInstructionsProgram } from "#program/UsageInstructionsProgram/UsageInstructionsProgram.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"

export async function updraftCliProgram(
	args: Array<string>,
): Promise<ExitCode> {
	if (args.length === 0 || args.includes("--help")) {
		return usageInstructionsProgram()
	}
	if (args.includes("--version")) {
		return toolVersionProgram()
	}
	return updraftProgram(
		args,
		"\nFor usage instructions, please run the program with the --help option.",
	)
}
