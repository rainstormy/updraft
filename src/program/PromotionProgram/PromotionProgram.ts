import type { File } from "+adapters/FileSystem/File"
import { readMatchingFiles, writeFiles } from "+adapters/FileSystem/FileSystem"
import { printError, printWarning } from "+adapters/Logger/Logger"
import { today } from "+adapters/Today/Today"
import { promoteAsciidocChangelog } from "+promoters/PromoteAsciidocChangelog/PromoteAsciidocChangelog"
import { promotePackageJson } from "+promoters/PromotePackageJson/PromotePackageJson"
import { type ExitCode, assertError } from "+utilities/ErrorUtilities"
import { isFulfilled, isRejected } from "+utilities/PromiseUtilities"
import type { Release } from "+utilities/Release"
import type { SemanticVersionString } from "+utilities/StringUtilities"

const promoters: Record<FileType, Promoter> = {
	"asciidoc-changelog": promoteAsciidocChangelog,
	"package-json": promotePackageJson,
}

type FileType = "asciidoc-changelog" | "package-json"
type Promoter = (content: string, release: Release) => Promise<string>

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
			try {
				const originalContent = file.content
				const fileType = detectFileType(file.path)
				const promoter = promoters[fileType]

				const promotedContent = await promoter(originalContent, newRelease)
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

function detectFileType(path: string): FileType {
	const filename = path.split("/").at(-1) ?? ""

	if (filename === "package.json") {
		return "package-json"
	}
	if (filename.endsWith(".adoc")) {
		return "asciidoc-changelog"
	}
	throw new Error("is not a supported file format")
}
