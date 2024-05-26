import { printError } from "+adapters/Logger/Logger"
import type { ExitCode } from "+utilities/ErrorUtilities"

export async function invalidConfigurationProgram(
	errorMessage: string,
): Promise<ExitCode> {
	printError(`${errorMessage}\n${usageInstructionsReminder}`)
	return 2
}

const usageInstructionsReminder =
	"For usage instructions, please run the program with the --help option."
