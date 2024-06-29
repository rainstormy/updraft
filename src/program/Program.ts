import { invalidConfigurationProgram } from "+program/InvalidConfigurationProgram/InvalidConfigurationProgram"
import { promotionProgram } from "+program/PromotionProgram/PromotionProgram"
import { toolVersionProgram } from "+program/ToolVersionProgram/ToolVersionProgram"
import { usageInstructionsProgram } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import { parseArgs } from "+utilities/ArgsUtilities"
import { type ExitCode, assertError } from "+utilities/ErrorUtilities"
import { extractSemanticVersionString } from "+utilities/StringUtilities"

export async function mainProgram(args: Array<string>): Promise<ExitCode> {
	try {
		const parsedArgs = parseArgs(args, [
			"--files",
			"--help",
			"--prerelease-files",
			"--release-files",
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
			return invalidConfigurationProgram("--release-version is required.")
		}
		if (rawReleaseVersions.length === 0) {
			return invalidConfigurationProgram("--release-version requires a value.")
		}
		if (rawReleaseVersions.length > 1) {
			return invalidConfigurationProgram(
				"--release-version cannot have more than one value.",
			)
		}

		const releaseVersion = extractSemanticVersionString(rawReleaseVersions[0])

		if (releaseVersion === null) {
			return invalidConfigurationProgram(
				`--release-version has an invalid value '${rawReleaseVersions[0]}'.`,
			)
		}

		const files = parsedArgs["--files"]
		if (files?.length === 0) {
			return invalidConfigurationProgram("--files requires a value.")
		}

		const releaseFiles = parsedArgs["--release-files"]
		if (releaseFiles?.length === 0) {
			return invalidConfigurationProgram("--release-files requires a value.")
		}

		const prereleaseFiles = parsedArgs["--prerelease-files"]
		if (prereleaseFiles?.length === 0) {
			return invalidConfigurationProgram("--prerelease-files requires a value.")
		}

		if (files === null && releaseFiles === null && prereleaseFiles === null) {
			return invalidConfigurationProgram(
				"--files, --release-files, or --prerelease-files is required.",
			)
		}

		return promotionProgram(
			files ?? [],
			prereleaseFiles ?? [],
			releaseFiles ?? [],
			releaseVersion,
		)
	} catch (error) {
		assertError(error)
		return invalidConfigurationProgram(error.message)
	}
}
