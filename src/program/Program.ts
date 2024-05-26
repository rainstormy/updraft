import { getConfigurationFromArgs } from "+program/Configuration"
import { invalidConfigurationProgram } from "+program/InvalidConfigurationProgram/InvalidConfigurationProgram"
import { promotionProgram } from "+program/PromotionProgram/PromotionProgram"
import { toolVersionProgram } from "+program/ToolVersionProgram/ToolVersionProgram"
import { usageInstructionsProgram } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import type { ExitCode } from "+utilities/ErrorUtilities"

export async function mainProgram(args: Array<string>): Promise<ExitCode> {
	const configuration = getConfigurationFromArgs(args)

	switch (configuration.type) {
		case "help-screen": {
			return usageInstructionsProgram()
		}

		case "invalid": {
			const { errorMessage } = configuration
			return invalidConfigurationProgram(errorMessage)
		}

		case "release": {
			const { filePatterns, releaseVersion } = configuration
			return promotionProgram(filePatterns, releaseVersion)
		}

		case "tool-version": {
			return toolVersionProgram()
		}
	}
}
