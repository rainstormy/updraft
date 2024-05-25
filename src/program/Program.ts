import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import { getConfigurationFromArgs } from "+program/Configuration"
import { invalidConfigurationProgram } from "+program/InvalidConfigurationProgram/InvalidConfigurationProgram"
import { promotionProgram } from "+program/PromotionProgram/PromotionProgram"
import { toolVersionProgram } from "+program/ToolVersionProgram/ToolVersionProgram"
import { usageInstructionsProgram } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import type { ExitCode } from "+utilities/ErrorUtilities"

export async function mainProgram(
	args: Array<string>,
	sideEffects: {
		onDisplayingMessage: OnDisplayingMessage
		onListingMatchingFiles: OnListingMatchingFiles
		onReadingFiles: OnReadingFiles
		onWritingToFiles: OnWritingToFiles
	},
): Promise<ExitCode> {
	const configuration = getConfigurationFromArgs(args)

	switch (configuration.type) {
		case "help-screen":
			return usageInstructionsProgram(sideEffects.onDisplayingMessage)

		case "invalid":
			return invalidConfigurationProgram(
				configuration.errorMessage,
				sideEffects.onDisplayingMessage,
			)

		case "release":
			return promotionProgram(
				configuration.filePatterns,
				configuration.releaseVersion,
				sideEffects.onDisplayingMessage,
				sideEffects.onListingMatchingFiles,
				sideEffects.onReadingFiles,
				sideEffects.onWritingToFiles,
			)

		case "tool-version":
			return toolVersionProgram(sideEffects.onDisplayingMessage)
	}
}
