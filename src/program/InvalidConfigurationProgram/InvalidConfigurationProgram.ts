import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { ExitCode } from "+utilities/ErrorUtilities"

export async function invalidConfigurationProgram(
	errorMessage: string,
	onDisplayingMessage: OnDisplayingMessage,
): Promise<ExitCode> {
	await onDisplayingMessage({
		severity: "error",
		message: `${errorMessage}\n${usageInstructionsReminder}`,
	})
	return 2
}

const usageInstructionsReminder =
	"For usage instructions, please run the program with the --help option."
