import { printMessage } from "#adapters/Logger/Logger.ts"
import { EXIT_CODE_SUCCESS, type ExitCode } from "#utilities/ExitCode.ts"
import type { UpdraftVersion } from "#utilities/version/UpdraftVersion.ts"

export async function toolVersionProgram(): Promise<ExitCode> {
	const version: UpdraftVersion = import.meta.env.UPDRAFT_VERSION

	printMessage(version)
	return EXIT_CODE_SUCCESS
}
