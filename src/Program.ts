import { type OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import { type OnListingMatchingFiles } from "+adapters/OnListingMatchingFiles"
import { type OnReadingFiles } from "+adapters/OnReadingFiles"
import { type OnWritingToFiles } from "+adapters/OnWritingToFiles"
import { parseAsciidocChangelog } from "+changelogs/AsciidocChangelogParser"
import { serializeChangelogToAsciidoc } from "+changelogs/AsciidocChangelogSerializer"
import { promoteChangelog } from "+changelogs/ChangelogPromoter"
import { promotePackage } from "+packages/PackagePromoter"
import { isFulfilled, isRejected } from "+utilities/assertions"
import { assertError, type ExitCode } from "+utilities/ErrorUtilities"
import { type FileType, type PathWithContent } from "+utilities/FileUtilities"
import { type Release } from "+utilities/Release"
import {
	type DateString,
	type SemanticVersionString,
} from "+utilities/StringUtilities"
import { type Configuration } from "./Configuration"

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
		readonly configuration: Configuration
		readonly today: DateString
		readonly toolVersion: SemanticVersionString
	},
	sideEffects: {
		readonly onDisplayingMessage: OnDisplayingMessage
		readonly onListingMatchingFiles: OnListingMatchingFiles
		readonly onReadingFiles: OnReadingFiles
		readonly onWritingToFiles: OnWritingToFiles
	},
): Promise<ExitCode> {
	const { configuration, today, toolVersion } = input
	const {
		onDisplayingMessage,
		onListingMatchingFiles,
		onReadingFiles,
		onWritingToFiles,
	} = sideEffects

	switch (configuration.type) {
		case "help-screen": {
			return await displayInformation({
				message: usageInstructions,
			})
		}
		case "invalid": {
			return await displayInvalidInputError({
				message: configuration.errorMessage + usageInstructionsReminder,
			})
		}
		case "tool-version": {
			return await displayInformation({
				message: toolVersion,
			})
		}
	}

	const { filePatterns, releaseVersion } = configuration
	const newRelease: Release = { version: releaseVersion, date: today }

	try {
		const matchingFiles = await onListingMatchingFiles({ filePatterns })

		if (matchingFiles.length === 0) {
			return await displayWarning({
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
					] as const,
			),
		)

		const errors = promotionResults.filter(isRejected).map(({ reason }) => {
			assertError(reason)
			return reason.message
		})

		if (errors.length > 0) {
			return await displayGeneralErrors({ messages: errors })
		}

		const outputPathsWithContent = promotionResults
			.filter(isFulfilled)
			.map(({ value }) => value)

		await onWritingToFiles({ outputPathsWithContent })
		return 0
	} catch (error) {
		assertError(error)
		return await displayGeneralErrors({ messages: [error.message] })
	}

	async function displayInformation(input: {
		readonly message: string
	}): Promise<ExitCode.Success> {
		const { message } = input

		await onDisplayingMessage({ severity: "info", message })
		return 0
	}

	async function displayWarning(input: {
		readonly message: string
	}): Promise<ExitCode.Success> {
		const { message } = input

		await onDisplayingMessage({ severity: "warning", message })
		return 0
	}

	async function displayGeneralErrors(input: {
		readonly messages: ReadonlyArray<string>
	}): Promise<ExitCode.GeneralError> {
		const { messages } = input

		for (const message of messages) {
			await onDisplayingMessage({ severity: "error", message })
		}

		return 1
	}

	async function displayInvalidInputError(input: {
		readonly message: string
	}): Promise<ExitCode.InvalidInput> {
		const { message } = input

		await onDisplayingMessage({ severity: "error", message: message })
		return 2
	}
}

async function promoteFile(input: {
	readonly path: string
	readonly originalContent: string
	readonly newRelease: Release
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

function detectFileType(input: { readonly path: string }): FileType {
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
	readonly path: string
	readonly originalContent: string
	readonly newRelease: Release
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
	readonly path: string
	readonly originalContent: string
	readonly newRelease: Release
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
