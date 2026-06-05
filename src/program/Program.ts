import type { File } from "#adapters/FileSystem/File.ts"
import { readMatchingFiles, writeFiles } from "#adapters/FileSystem/FileSystem.ts"
import { type PromotableFile, filterPromotableFiles } from "#adapters/FileSystem/PromotableFile.ts"
import { printError, printMessage, printWarning } from "#adapters/Logger/Logger.ts"
import { today } from "#adapters/Today/Today.ts"
import { promoteAsciidocChangelog } from "#promoters/PromoteAsciidocChangelog/PromoteAsciidocChangelog.ts"
import { promoteMarkdownChangelog } from "#promoters/PromoteMarkdownChangelog/PromoteMarkdownChangelog.ts"
import { promotePackageJson } from "#promoters/PromotePackageJson/PromotePackageJson.ts"
import { defineOptions, parseArgs } from "#utilities/ArgsUtilities.ts"
import { assertError } from "#utilities/ErrorUtilities.ts"
import {
	EXIT_CODE_GENERAL_ERROR,
	EXIT_CODE_INVALID_INPUT,
	EXIT_CODE_SUCCESS,
	type ExitCode,
} from "#utilities/ExitCode.ts"
import { notNullish } from "#utilities/IterableUtilities.ts"
import { isFulfilled, isRejected } from "#utilities/PromiseUtilities.ts"
import type { Release, ReleaseCheck } from "#utilities/types/Release.ts"
import {
	type SemanticVersionString,
	extractSemanticVersionString,
	isPrerelease,
} from "#utilities/types/SemanticVersionString.ts"

export async function program(
	args: Array<string>,
	usageInstructionsReminder = "",
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
		printError(`${error.message}${usageInstructionsReminder}`)
		return EXIT_CODE_INVALID_INPUT
	}

	const checkSequentialRelease = parsedArgs["--check-sequential-release"] !== undefined
	const files = parsedArgs["--files"] ?? []
	const prereleaseFiles = parsedArgs["--prerelease-files"] ?? []
	const releaseFiles = parsedArgs["--release-files"] ?? []
	const releaseVersion = parsedArgs["--release-version"]?.[0] ?? ""

	if (files.length + prereleaseFiles.length + releaseFiles.length === 0) {
		printError(
			`--files, --release-files, or --prerelease-files is required.${usageInstructionsReminder}`,
		)
		return EXIT_CODE_INVALID_INPUT
	}

	const semanticReleaseVersion = extractSemanticVersionString(releaseVersion)

	if (semanticReleaseVersion === null) {
		printError(
			`--release-version has an invalid value '${releaseVersion}'.${usageInstructionsReminder}`,
		)
		return EXIT_CODE_INVALID_INPUT
	}

	const filePatterns = isPrerelease(semanticReleaseVersion)
		? [...files, ...prereleaseFiles]
		: [...files, ...releaseFiles]

	const checks = (
		[checkSequentialRelease ? "sequential" : null] satisfies Array<ReleaseCheck | null>
	).filter(notNullish)

	return promotionProgram(filePatterns, {
		checks,
		version: semanticReleaseVersion,
	})
}

async function promotionProgram(
	filePatterns: Array<string>,
	release: {
		checks: Array<ReleaseCheck>
		version: SemanticVersionString
	},
): Promise<ExitCode> {
	if (filePatterns.length === 0) {
		printMessage(
			`No files set to be updated in release version ${release.version}, as it is ${
				isPrerelease(release.version) ? "a prerelease" : "not a prerelease"
			}.`,
		)
		return EXIT_CODE_SUCCESS
	}

	try {
		const files = await readMatchingFiles(filePatterns)
		const promotableFiles = filterPromotableFiles(files)

		if (promotableFiles.length === 0) {
			printWarning(`${filePatterns.join(", ")} did not match any supported files.`)
			return EXIT_CODE_SUCCESS
		}

		const newRelease: Release = { ...release, date: today() }
		const promotionResults = await Promise.allSettled(
			promotableFiles.map(async (file) => promoteFile(file, newRelease)),
		)

		const errors = promotionResults.filter(isRejected).map(({ reason }) => {
			assertError(reason)
			return reason.message
		})

		if (errors.length > 0) {
			for (const message of errors) {
				printError(message)
			}
			return EXIT_CODE_GENERAL_ERROR
		}

		const outputFiles = promotionResults.filter(isFulfilled).map(({ value }) => value)

		await writeFiles(outputFiles)
		return EXIT_CODE_SUCCESS
	} catch (error) {
		assertError(error)
		printError(error.message)
		return EXIT_CODE_GENERAL_ERROR
	}
}

async function promoteFile(file: PromotableFile, newRelease: Release): Promise<File> {
	try {
		return { content: await promoteFileContent(file, newRelease), path: file.path }
	} catch (error) {
		assertError(error)
		throw new Error(`${file.path} ${error.message}.`, { cause: error })
	}
}

async function promoteFileContent(file: PromotableFile, newRelease: Release): Promise<string> {
	const originalContent = file.content

	switch (file.type) {
		case "CHANGELOG.adoc": {
			return promoteAsciidocChangelog(originalContent, newRelease)
		}
		case "CHANGELOG.md": {
			return promoteMarkdownChangelog(originalContent, newRelease)
		}
		case "package.json": {
			return promotePackageJson(originalContent, newRelease)
		}
	}
}
