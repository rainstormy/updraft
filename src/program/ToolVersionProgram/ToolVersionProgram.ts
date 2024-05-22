import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { ExitCode } from "+utilities/ErrorUtilities"
import type { SemanticVersionString } from "+utilities/StringUtilities"

export async function toolVersionProgram(
	toolVersion: SemanticVersionString,
	onDisplayingMessage: OnDisplayingMessage,
): Promise<ExitCode> {
	await onDisplayingMessage({ severity: "info", message: toolVersion })
	return 0
}
