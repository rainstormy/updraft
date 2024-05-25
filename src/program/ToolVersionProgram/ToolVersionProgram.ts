import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import { packageJsonVersion } from "+adapters/PackageJsonVersion/PackageJsonVersion"
import type { ExitCode } from "+utilities/ErrorUtilities"

export async function toolVersionProgram(
	onDisplayingMessage: OnDisplayingMessage,
): Promise<ExitCode> {
	await onDisplayingMessage({
		severity: "info",
		message: packageJsonVersion(),
	})
	return 0
}
