import { printError } from "#adapters/Logger/Logger.ts"
import { EXIT_CODE_INVALID_INPUT, type ExitCode } from "#utilities/ExitCode.ts"

export async function invalidConfigurationProgram(
	errorMessage: string,
	usageInstructionsReminder?: string,
): Promise<ExitCode> {
	printError(`${errorMessage}${usageInstructionsReminder ?? ""}`)
	return EXIT_CODE_INVALID_INPUT
}
