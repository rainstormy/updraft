import type { OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import type { OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import type { OnReadingFiles } from "+adapters/OnReadingFiles"
import type { OnWritingToFiles } from "+adapters/OnWritingToFiles"
import { parseAsciidocChangelog } from "+changelogs/AsciidocChangelogParser"
import { serializeChangelogToAsciidoc } from "+changelogs/AsciidocChangelogSerializer"
import { promoteChangelog } from "+changelogs/ChangelogPromoter"
import type { Configuration } from "+configuration/Configuration"
import { promotePackage } from "+packages/PackagePromoter"
import { type ExitCode, assertError } from "+utilities/ErrorUtilities"
import type { FileType, PathWithContent } from "+utilities/FileUtilities"
import { isFulfilled, isRejected } from "+utilities/PromiseUtilities"
import type { Release } from "+utilities/Release"
import type {
	DateString,
	SemanticVersionString,
} from "+utilities/StringUtilities"

export const usageInstructions = `Usage: updraft [options]

This tool prepares a repository for an upcoming release by updating changelogs
and bumping version numbers in package.json files.

Supported file formats:
  * AsciiDoc-based changelogs (*.adoc) in Keep a Changelog format.
  * package.json.

Options:
  --files <patterns>           Update files matching the glob patterns.
                               Mandatory when --release-version is specified.

                               Use whitespace to separate multiple patterns:
                               <pattern-1> <pattern-2> <pattern-3>

  --help                       Display this help screen and exit.

  --release-version <version>  The semantic version of the upcoming release.
                               Mandatory when --files is specified.

                               Expected format (optional parts in brackets):
                               [v]major.minor.patch[-prerelease][+buildinfo]

  --version                    Display the version of this tool and exit.`

const usageInstructionsReminder =
	"\nFor usage instructions, please run the program with the --help option."

export async function runProgram(
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
	const { configuration, today, toolVersion } = input
	const {
		onDisplayingMessage,
		onListingMatchingFiles,
		onReadingFiles,
		onWritingToFiles,
	} = sideEffects

	if (configuration.type === "help-screen") {
		return displayInformation({ message: usageInstructions })
	}

	if (configuration.type === "invalid") {
		return displayInvalidInputError({
			message: configuration.errorMessage + usageInstructionsReminder,
		})
	}

	if (configuration.type === "tool-version") {
		return displayInformation({ message: toolVersion })
	}

	const { filePatterns, releaseVersion } = configuration
	const newRelease: Release = { version: releaseVersion, date: today }

	try {
		const matchingFiles = await onListingMatchingFiles({ filePatterns })

		if (matchingFiles.length === 0) {
			return displayWarning({
				message: `${filePatterns.join(", ")} did not match any files.`,
			})
		}

		const pathsWithOriginalContent = await onReadingFiles({
			paths: matchingFiles,
		})

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
			return displayGeneralErrors({ messages: errors })
		}

		const outputPathsWithContent = promotionResults
			.filter(isFulfilled)
			.map(({ value }) => value)

		await onWritingToFiles({ outputPathsWithContent })
		return 0
	} catch (error) {
		assertError(error)
		return displayGeneralErrors({ messages: [error.message] })
	}

	async function displayInformation(input: {
		message: string
	}): Promise<ExitCode.Success> {
		const { message } = input

		await onDisplayingMessage({ severity: "info", message })
		return 0
	}

	async function displayWarning(input: {
		message: string
	}): Promise<ExitCode.Success> {
		const { message } = input

		await onDisplayingMessage({ severity: "warning", message })
		return 0
	}

	async function displayGeneralErrors(input: {
		messages: Array<string>
	}): Promise<ExitCode.GeneralError> {
		const { messages } = input

		for (const message of messages) {
			await onDisplayingMessage({ severity: "error", message })
		}

		return 1
	}

	async function displayInvalidInputError(input: {
		message: string
	}): Promise<ExitCode.InvalidInput> {
		const { message } = input

		await onDisplayingMessage({ severity: "error", message })
		return 2
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
