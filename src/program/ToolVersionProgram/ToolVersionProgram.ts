import { printMessage } from "+adapters/Logger/Logger"
import { packageJsonVersion } from "+adapters/PackageJsonVersion/PackageJsonVersion"
import type { ExitCode } from "+utilities/ErrorUtilities"

export async function toolVersionProgram(): Promise<ExitCode> {
	printMessage(packageJsonVersion())
	return 0
}
