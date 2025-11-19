import { printMessage } from "#adapters/Logger/Logger.ts"
import { packageJsonVersion } from "#adapters/PackageJsonVersion/PackageJsonVersion.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"

export async function toolVersionProgram(): Promise<ExitCode> {
	printMessage(packageJsonVersion())
	return 0
}
