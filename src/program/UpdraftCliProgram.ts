import { toolVersionProgram } from "+program/ToolVersionProgram/ToolVersionProgram"
import { updraftProgram } from "+program/UpdraftProgram"
import { usageInstructionsProgram } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import type { ExitCode } from "+utilities/ErrorUtilities"

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
