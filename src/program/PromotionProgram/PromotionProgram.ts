import type { File } from "#adapters/FileSystem/File.ts"
import { readMatchingFiles, writeFiles } from "#adapters/FileSystem/FileSystem.ts"
import { type PromotableFile, filterPromotableFiles } from "#adapters/FileSystem/PromotableFile.ts"
import { printError, printMessage, printWarning } from "#adapters/Logger/Logger.ts"
import { today } from "#adapters/Today/Today.ts"
import { promoteAsciidocChangelog } from "#promoters/PromoteAsciidocChangelog/PromoteAsciidocChangelog.ts"
import { promoteMarkdownChangelog } from "#promoters/PromoteMarkdownChangelog/PromoteMarkdownChangelog.ts"
import { promotePackageJson } from "#promoters/PromotePackageJson/PromotePackageJson.ts"
import { assertError } from "#utilities/ErrorUtilities.ts"
import { EXIT_CODE_GENERAL_ERROR, EXIT_CODE_SUCCESS, type ExitCode } from "#utilities/ExitCode.ts"
import { isFulfilled, isRejected } from "#utilities/PromiseUtilities.ts"
import type { Release, ReleaseCheck } from "#utilities/types/Release.ts"
import { type SemanticVersionString, isPrerelease } from "#utilities/types/SemanticVersionString.ts"

export async function promotionProgram(
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
