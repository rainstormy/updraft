import { printError } from "#adapters/Logger/Logger.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"

export async function invalidConfigurationProgram(
	errorMessage: string,
	usageInstructionsReminder?: string,
): Promise<ExitCode> {
	printError(`${errorMessage}${usageInstructionsReminder ?? ""}`)
	return 2
}
