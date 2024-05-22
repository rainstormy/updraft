import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import type { Configuration } from "+configuration/Configuration"
import { invalidConfigurationProgram } from "+program/InvalidConfigurationProgram/InvalidConfigurationProgram"
import { promotionProgram } from "+program/PromotionProgram/PromotionProgram"
import { toolVersionProgram } from "+program/ToolVersionProgram/ToolVersionProgram"
import { usageInstructionsProgram } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import type { ExitCode } from "+utilities/ErrorUtilities"
import type {
	DateString,
	SemanticVersionString,
} from "+utilities/StringUtilities"

export async function mainProgram(
	input: {
		configuration: Configuration
		today: DateString
		toolVersion: SemanticVersionString
	},
	sideEffects: {
		onDisplayingMessage: OnDisplayingMessage
		onListingMatchingFiles: OnListingMatchingFiles
		onReadingFiles: OnReadingFiles
		onWritingToFiles: OnWritingToFiles
	},
): Promise<ExitCode> {
	switch (input.configuration.type) {
		case "help-screen":
			return usageInstructionsProgram(sideEffects.onDisplayingMessage)

		case "invalid":
			return invalidConfigurationProgram(
				input.configuration.errorMessage,
				sideEffects.onDisplayingMessage,
			)

		case "release":
			return promotionProgram(
				input.configuration.filePatterns,
				input.configuration.releaseVersion,
				input.today,
				sideEffects.onDisplayingMessage,
				sideEffects.onListingMatchingFiles,
				sideEffects.onReadingFiles,
				sideEffects.onWritingToFiles,
			)

		case "tool-version":
			return toolVersionProgram(
				input.toolVersion,
				sideEffects.onDisplayingMessage,
			)
	}
}
