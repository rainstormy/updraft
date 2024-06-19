import { invalidConfigurationProgram } from "+program/InvalidConfigurationProgram/InvalidConfigurationProgram"
import { promotionProgram } from "+program/PromotionProgram/PromotionProgram"
import { toolVersionProgram } from "+program/ToolVersionProgram/ToolVersionProgram"
import { usageInstructionsProgram } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import { parseArgs } from "+utilities/ArgsUtilities"
import { type ExitCode, assertError } from "+utilities/ErrorUtilities"
import { isSemanticVersionString } from "+utilities/StringUtilities"

export async function mainProgram(args: Array<string>): Promise<ExitCode> {
	try {
		const parsedArgs = parseArgs(args, [
			"--files",
			"--help",
			"--release-version",
			"--version",
		])

		if (args.length === 0 || parsedArgs["--help"] !== null) {
			return usageInstructionsProgram()
		}
		if (parsedArgs["--version"] !== null) {
			return toolVersionProgram()
		}

		const rawReleaseVersions = parsedArgs["--release-version"]

		if (rawReleaseVersions === null) {
			return invalidConfigurationProgram("--release-version must be specified.")
		}
		if (rawReleaseVersions.length === 0) {
			return invalidConfigurationProgram(
				"--release-version must specify a value.",
			)
		}
		if (rawReleaseVersions.length > 1) {
			return invalidConfigurationProgram(
				"--release-version must not specify more than one value.",
			)
		}

		const rawReleaseVersion = rawReleaseVersions[0]

		const releaseVersion = rawReleaseVersion.startsWith("v")
			? rawReleaseVersion.slice(1)
			: rawReleaseVersion

		if (!isSemanticVersionString(releaseVersion)) {
			return invalidConfigurationProgram(
				`--release-version has an invalid value '${rawReleaseVersion}'.`,
			)
		}

		const files = parsedArgs["--files"]

		if (files === null) {
			return invalidConfigurationProgram("--files must be specified.")
		}
		if (files.length === 0) {
			return invalidConfigurationProgram("--files must specify a value.")
		}

		return promotionProgram(files, releaseVersion)
	} catch (error) {
		assertError(error)
		return invalidConfigurationProgram(error.message)
	}
}
