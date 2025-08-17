import { printError } from "#adapters/Logger/Logger"
import type { ExitCode } from "#utilities/ErrorUtilities"

export async function invalidConfigurationProgram(
	errorMessage: string,
	usageInstructionsReminder: string,
): Promise<ExitCode> {
	printError(`${errorMessage}${usageInstructionsReminder}`)
	return 2
}
