import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import { today } from "+adapters/Today/Today"
import { parseAsciidocChangelog } from "+changelogs/AsciidocChangelogParser"
import { serializeChangelogToAsciidoc } from "+changelogs/AsciidocChangelogSerializer"
import { promoteChangelog } from "+changelogs/ChangelogPromoter"
import { promotePackage } from "+packages/PackagePromoter"
import { type ExitCode, assertError } from "+utilities/ErrorUtilities"
import type { FileType, PathWithContent } from "+utilities/FileUtilities"
import { isFulfilled, isRejected } from "+utilities/PromiseUtilities"
import type { Release } from "+utilities/Release"
import type { SemanticVersionString } from "+utilities/StringUtilities"

export async function promotionProgram(
	filePatterns: Array<string>,
	releaseVersion: SemanticVersionString,
	onDisplayingMessage: OnDisplayingMessage,
	onListingMatchingFiles: OnListingMatchingFiles,
	onReadingFiles: OnReadingFiles,
	onWritingToFiles: OnWritingToFiles,
): Promise<ExitCode> {
	try {
		const matchingFiles = await onListingMatchingFiles({ filePatterns })

		if (matchingFiles.length === 0) {
			await onDisplayingMessage({
				severity: "warning",
				message: `${filePatterns.join(", ")} did not match any files.`,
			})
			return 0
		}

		const pathsWithOriginalContent = await onReadingFiles({
			paths: matchingFiles,
		})

		const newRelease: Release = { version: releaseVersion, date: today() }

		const promotionResults = await Promise.allSettled<PathWithContent>(
			pathsWithOriginalContent.map(
				async ([path, originalContent]) =>
					[
						path,
						await promoteFile({ path, originalContent, newRelease }),
					] satisfies PathWithContent,
			),
		)

		const errors = promotionResults.filter(isRejected).map(({ reason }) => {
			assertError(reason)
			return reason.message
		})

		if (errors.length > 0) {
			for (const message of errors) {
				await onDisplayingMessage({ severity: "error", message })
			}
			return 1
		}

		const outputPathsWithContent = promotionResults
			.filter(isFulfilled)
			.map(({ value }) => value)

		await onWritingToFiles({ outputPathsWithContent })
		return 0
	} catch (error) {
		assertError(error)
		await onDisplayingMessage({ severity: "error", message: error.message })
		return 1
	}
}

async function promoteFile(input: {
	path: string
	originalContent: string
	newRelease: Release
}): Promise<string> {
	const { path, originalContent, newRelease } = input
	const fileType = detectFileType({ path })

	switch (fileType) {
		case "changelog-asciidoc": {
			return promoteChangelogFile({ path, originalContent, newRelease })
		}
		case "node-package-json": {
			return promotePackageJsonFile({ path, originalContent, newRelease })
		}
	}
}

function detectFileType(input: { path: string }): FileType {
	const { path } = input
	const filename = path.split("/").at(-1) ?? ""

	if (filename === "package.json") {
		return "node-package-json"
	}
	if (filename.endsWith(".adoc")) {
		return "changelog-asciidoc"
	}
	throw new Error(`${path} is not a supported file format.`)
}

async function promoteChangelogFile(input: {
	path: string
	originalContent: string
	newRelease: Release
}): Promise<string> {
	const { path, originalContent, newRelease } = input

	try {
		const originalChangelog = parseAsciidocChangelog(originalContent)
		const promotedChangelog = await promoteChangelog({
			originalChangelog,
			newRelease,
		})
		return serializeChangelogToAsciidoc(promotedChangelog)
	} catch (error) {
		assertError(error)
		throw new Error(`${path} ${error.message}.`)
	}
}

async function promotePackageJsonFile(input: {
	path: string
	originalContent: string
	newRelease: Release
}): Promise<string> {
	const { path, originalContent, newRelease } = input

	try {
		return await promotePackage({
			originalPackageContent: originalContent,
			newRelease,
		})
	} catch (error) {
		assertError(error)
		throw new Error(`${path} ${error.message}.`)
	}
}
