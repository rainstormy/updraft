import type { File } from "+adapters/FileSystem/File"
import { readMatchingFiles, writeFiles } from "+adapters/FileSystem/FileSystem"
import { printError, printWarning } from "+adapters/Logger/Logger"
import { today } from "+adapters/Today/Today"
import { parseAsciidocChangelog } from "+changelogs/AsciidocChangelogParser"
import { serializeChangelogToAsciidoc } from "+changelogs/AsciidocChangelogSerializer"
import { promoteChangelog } from "+changelogs/ChangelogPromoter"
import { promotePackage } from "+packages/PackagePromoter"
import { type ExitCode, assertError } from "+utilities/ErrorUtilities"
import { isFulfilled, isRejected } from "+utilities/PromiseUtilities"
import type { Release } from "+utilities/Release"
import type { SemanticVersionString } from "+utilities/StringUtilities"

export async function promotionProgram(
	filePatterns: Array<string>,
	releaseVersion: SemanticVersionString,
): Promise<ExitCode> {
	try {
		const files = await readMatchingFiles(filePatterns)

		if (files.length === 0) {
			printWarning(`${filePatterns.join(", ")} did not match any files.`)
			return 0
		}

		const newRelease: Release = { version: releaseVersion, date: today() }

		const promotionResults = await Promise.allSettled(files.map(promoteFile))

		const errors = promotionResults.filter(isRejected).map(({ reason }) => {
			assertError(reason)
			return reason.message
		})

		if (errors.length > 0) {
			for (const message of errors) {
				printError(message)
			}
			return 1
		}

		const outputFiles = promotionResults
			.filter(isFulfilled)
			.map(({ value }) => value)

		await writeFiles(outputFiles)
		return 0

		async function promoteFile(file: File): Promise<File> {
			switch (file.type) {
				case "asciidoc-changelog": {
					return promoteChangelogFile(file)
				}
				case "package-json": {
					return promotePackageJsonFile(file)
				}
			}
		}

		async function promoteChangelogFile(file: File): Promise<File> {
			try {
				const originalChangelog = parseAsciidocChangelog(file.content)
				const promotedChangelog = await promoteChangelog({
					originalChangelog,
					newRelease,
				})
				const promotedContent = serializeChangelogToAsciidoc(promotedChangelog)
				return { ...file, content: promotedContent }
			} catch (error) {
				assertError(error)
				throw new Error(`${file.path} ${error.message}.`)
			}
		}

		async function promotePackageJsonFile(file: File): Promise<File> {
			try {
				const promotedContent = await promotePackage({
					originalPackageContent: file.content,
					newRelease,
				})
				return { ...file, content: promotedContent }
			} catch (error) {
				assertError(error)
				throw new Error(`${file.path} ${error.message}.`)
			}
		}
	} catch (error) {
		assertError(error)
		printError(error.message)
		return 1
	}
}
