import { printMessage } from "#adapters/Logger/Logger.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"
import type { UpdraftVersion } from "#utilities/version/UpdraftVersion.ts"

export async function toolVersionProgram(): Promise<ExitCode> {
	const version: UpdraftVersion = import.meta.env.UPDRAFT_VERSION

	printMessage(version)
	return 0
}
