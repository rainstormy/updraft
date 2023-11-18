import { type OnDisplayingMessage } from "+adapters/OnDisplayingMessage"
import { type OnReadingMatchingFiles } from "+adapters/OnReadingMatchingFiles"
import { type OnWritingToFiles } from "+adapters/OnWritingToFiles"
import { parseAsciidocChangelog } from "+changelogs/AsciidocChangelogParser"
import { serializeChangelogToAsciidoc } from "+changelogs/AsciidocChangelogSerializer"
import { promoteChangelog } from "+changelogs/ChangelogPromoter"
import { promotePackage } from "+packages/PackagePromoter"
import { type ExitCode } from "+utilities/ExitCode"
import { assertError, isFulfilled, isRejected } from "+utilities/assertions"
import {
	type PathWithContent,
	type PathsWithContent,
} from "+utilities/io-types"
import { dedent } from "+utilities/string-transformations"
import { type Configuration } from "./Configuration"

export const usageInstructions = dedent`
	Usage: release <semantic-version> [options]

	This tool prepares a new release by updating certain files accordingly.

	  <semantic-version>  The semantic version of the new release.
	                      Mandatory except for --help and --version.
	                      Format: major.minor.patch[-prerelease][+buildinfo]

	Options:
	  --changelogs <patterns>  Update changelog files matching the glob patterns.
	                           Supported formats: AsciiDoc (*.adoc).

	  --help                   Display this help screen and exit.

	  --packages <patterns>    Update package.json files matching the glob patterns.

	  --version                Display the version of this tool and exit.
`

export async function runProgram(
	input: {
		readonly configuration: Configuration
	},
	sideEffects: {
		readonly onDisplayingMessage: OnDisplayingMessage
		readonly onReadingMatchingFiles: OnReadingMatchingFiles
		readonly onWritingToFiles: OnWritingToFiles
	},
): Promise<ExitCode> {
	const { configuration } = input
	const { onDisplayingMessage, onReadingMatchingFiles, onWritingToFiles } =
		sideEffects

	switch (configuration.type) {
		case "display-help-screen": {
			return await displayInformation({ message: usageInstructions })
		}
		case "display-tool-version": {
			return await displayInformation({ message: configuration.toolVersion })
		}
		case "error-release-version-missing": {
			return await raiseInvalidInputErrors({
				messages: [
					dedent`
						Expected the first argument to be the semantic version of the new release.
						For usage instructions, run the program with the --help option.
					`,
				],
			})
		}
		case "error-release-version-invalid": {
			return await raiseInvalidInputErrors({
				messages: [
					dedent`
						Expected the first argument to be a valid semantic version number, but was '${configuration.providedReleaseVersion}'.
						For usage instructions, run the program with the --help option.
					`,
				],
			})
		}
		case "error-changelog-file-pattern-missing": {
			return await raiseInvalidInputErrors({
				messages: [
					dedent`
						Expected one or more glob patterns to follow the --changelogs option.
						For usage instructions, run the program with the --help option.
					`,
				],
			})
		}
		case "error-package-file-pattern-missing": {
			return await raiseInvalidInputErrors({
				messages: [
					dedent`
						Expected one or more glob patterns to follow the --packages option.
						For usage instructions, run the program with the --help option.
					`,
				],
			})
		}
	}

	const { changelogGlobPatterns, packageGlobPatterns, newRelease } =
		configuration

	try {
		const pathsWithOriginalChangelogContent = await readMatchingFiles({
			globPatterns: changelogGlobPatterns,
		})
		const pathsWithOriginalPackageContent = await readMatchingFiles({
			globPatterns: packageGlobPatterns,
		})

		const promotionResults = await Promise.allSettled<PathWithContent>([
			...pathsWithOriginalChangelogContent.map(
				async ([path, originalChangelogContent]) =>
					[
						path,
						await promoteChangelogFile({ path, originalChangelogContent }),
					] as const,
			),
			...pathsWithOriginalPackageContent.map(
				async ([path, originalPackageContent]) =>
					[
						path,
						await promotePackageFile({ path, originalPackageContent }),
					] as const,
			),
		])

		const errors = promotionResults.filter(isRejected).map(({ reason }) => {
			assertError(reason)
			return reason.message
		})

		if (errors.length > 0) {
			return await raiseGeneralErrors({ messages: errors })
		}

		const outputPathsWithContent = promotionResults
			.filter(isFulfilled)
			.map(({ value }) => value)

		if (outputPathsWithContent.length > 0) {
			await onWritingToFiles({ outputPathsWithContent })
		}

		return 0
	} catch (error) {
		assertError(error)
		return await raiseGeneralErrors({ messages: [error.message] })
	}

	async function displayInformation(input: {
		readonly message: string
	}): Promise<ExitCode.Success> {
		const { message } = input

		await onDisplayingMessage({ severity: "info", message })
		return 0
	}

	async function raiseGeneralErrors(input: {
		readonly messages: ReadonlyArray<string>
	}): Promise<ExitCode.GeneralError> {
		await raiseErrors(input)
		return 1
	}

	async function raiseInvalidInputErrors(input: {
		readonly messages: ReadonlyArray<string>
	}): Promise<ExitCode.InvalidInput> {
		await raiseErrors(input)
		return 2
	}

	async function raiseErrors(input: {
		readonly messages: ReadonlyArray<string>
	}): Promise<void> {
		const { messages } = input

		for (const message of messages) {
			await onDisplayingMessage({ severity: "error", message })
		}
	}

	async function readMatchingFiles(input: {
		globPatterns: ReadonlyArray<string>
	}): Promise<PathsWithContent> {
		const { globPatterns } = input

		if (globPatterns.length === 0) {
			return []
		}

		const pathsWithContent = await onReadingMatchingFiles({ globPatterns })

		if (pathsWithContent.length === 0 && globPatterns.length > 0) {
			await onDisplayingMessage({
				severity: "warning",
				message: `${globPatterns.join(", ")} did not match any files.`,
			})
		}

		return pathsWithContent
	}

	async function promoteChangelogFile(input: {
		readonly path: string
		readonly originalChangelogContent: string
	}): Promise<string> {
		const { path, originalChangelogContent } = input

		try {
			const originalChangelog = parseAsciidocChangelog(originalChangelogContent)
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

	async function promotePackageFile(input: {
		readonly path: string
		readonly originalPackageContent: string
	}): Promise<string> {
		const { path, originalPackageContent } = input

		try {
			return await promotePackage({ originalPackageContent, newRelease })
		} catch (error) {
			assertError(error)
			throw new Error(`${path} ${error.message}.`)
		}
	}
}
