import { invalidConfigurationProgram } from "#program/InvalidConfigurationProgram/InvalidConfigurationProgram.ts"
import { promotionProgram } from "#program/PromotionProgram/PromotionProgram.ts"
import { defineOptions, parseArgs } from "#utilities/ArgsUtilities.ts"
import { assertError, type ExitCode } from "#utilities/ErrorUtilities.ts"
import { notNullish } from "#utilities/IterableUtilities.ts"
import type { ReleaseCheck } from "#utilities/types/Release.ts"
import {
	extractSemanticVersionString,
	isPrerelease,
} from "#utilities/types/SemanticVersionString.ts"

export async function updraftProgram(
	args: Array<string>,
	usageInstructionsReminder?: string,
): Promise<ExitCode> {
	const schema = defineOptions({
		"--check-sequential-release": { args: { min: 0, max: 0 } },
		"--files": { args: { min: 1 } },
		"--prerelease-files": { args: { min: 1 } },
		"--release-files": { args: { min: 1 } },
		"--release-version": { required: true, args: { min: 1, max: 1 } },
	})

	let parsedArgs: Record<keyof typeof schema, Array<string> | undefined>

	try {
		parsedArgs = parseArgs(schema, args)
	} catch (error) {
		assertError(error)
		return invalidConfigurationProgram(error.message, usageInstructionsReminder)
	}

	const checkSequentialRelease =
		parsedArgs["--check-sequential-release"] !== undefined
	const files = parsedArgs["--files"] ?? []
	const prereleaseFiles = parsedArgs["--prerelease-files"] ?? []
	const releaseFiles = parsedArgs["--release-files"] ?? []
	const releaseVersion = parsedArgs["--release-version"]?.[0] ?? ""

	if (files.length + prereleaseFiles.length + releaseFiles.length === 0) {
		return invalidConfigurationProgram(
			"--files, --release-files, or --prerelease-files is required.",
			usageInstructionsReminder,
		)
	}

	const semanticReleaseVersion = extractSemanticVersionString(releaseVersion)

	if (semanticReleaseVersion === null) {
		return invalidConfigurationProgram(
			`--release-version has an invalid value '${releaseVersion}'.`,
			usageInstructionsReminder,
		)
	}

	const filePatterns = isPrerelease(semanticReleaseVersion)
		? [...files, ...prereleaseFiles]
		: [...files, ...releaseFiles]

	const checks = (
		[
			checkSequentialRelease ? "sequential" : null,
		] satisfies Array<ReleaseCheck | null>
	).filter(notNullish)

	return promotionProgram(filePatterns, {
		checks,
		version: semanticReleaseVersion,
	})
}
