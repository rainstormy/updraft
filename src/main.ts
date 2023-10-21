import type {
	OnDisplayingMessage,
	OnReadingMatchingFiles,
	OnWritingToFiles,
} from "+adapters"
import {
	onDisplayingMessageInConsole,
	onReadingMatchingFilesFromDisk,
	onWritingToFilesOnDisk,
} from "+adapters"
import type { OnPromotingChangelogs } from "+changelogs"
import { promoteChangelogs } from "+changelogs"
import type { Configuration } from "+configuration"
import { getConfigurationFromArgs } from "+configuration"
import type { OnPromotingPackages } from "+packages"
import { promotePackages } from "+packages"
import type { DateString, ExitCode, SemanticVersionString } from "+utilities"
import { dedent } from "+utilities"
import { argv } from "node:process"
import { version as toolVersion } from "../package.json" assert { type: "json" }

main(
	{
		configuration: getConfigurationFromArgs({
			args: argv.slice(2),
			today: new Date().toISOString().slice(0, 10) as DateString,
			toolVersion: toolVersion as SemanticVersionString,
		}),
	},
	{
		onDisplayingMessage: onDisplayingMessageInConsole,
		onPromotingChangelogs: promoteChangelogs,
		onPromotingPackages: promotePackages,
		onReadingMatchingFiles: onReadingMatchingFilesFromDisk,
		onWritingToFiles: onWritingToFilesOnDisk,
	},
).catch((error) => {
	console.error(error)
})

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

export async function main(
	input: {
		readonly configuration: Configuration
	},
	sideEffects: {
		readonly onDisplayingMessage: OnDisplayingMessage
		readonly onPromotingChangelogs: OnPromotingChangelogs
		readonly onPromotingPackages: OnPromotingPackages
		readonly onReadingMatchingFiles: OnReadingMatchingFiles
		readonly onWritingToFiles: OnWritingToFiles
	},
): Promise<ExitCode> {
	const { configuration } = input
	const {
		onDisplayingMessage,
		onPromotingChangelogs,
		onPromotingPackages,
		onReadingMatchingFiles,
		onWritingToFiles,
	} = sideEffects

	switch (configuration.type) {
		case "display-help-screen": {
			await onDisplayingMessage({
				level: "info",
				message: usageInstructions,
			})
			return 0
		}

		case "display-tool-version": {
			const { toolVersion } = configuration
			await onDisplayingMessage({ level: "info", message: toolVersion })
			return 0
		}

		case "error-release-version-missing": {
			await onDisplayingMessage({
				level: "error",
				message: dedent`
					Expected the first argument to be the semantic version of the new release.
					For usage instructions, run the program with the --help option.
				`,
			})
			return 2
		}

		case "error-release-version-invalid": {
			const { providedReleaseVersion } = configuration
			await onDisplayingMessage({
				level: "error",
				message: dedent`
					Expected the first argument to be a valid semantic version number, but was '${providedReleaseVersion}'.
					For usage instructions, run the program with the --help option.
				`,
			})
			return 2
		}

		case "error-changelog-file-pattern-missing": {
			await onDisplayingMessage({
				level: "error",
				message: dedent`
					Expected one or more glob patterns to follow the --changelogs option.
					For usage instructions, run the program with the --help option.
				`,
			})
			return 2
		}

		case "error-package-file-pattern-missing": {
			await onDisplayingMessage({
				level: "error",
				message: dedent`
					Expected one or more glob patterns to follow the --packages option.
					For usage instructions, run the program with the --help option.
				`,
			})
			return 2
		}
	}

	const {
		changelogGlobPatterns,
		packageGlobPatterns,
		release: newRelease,
	} = configuration

	const readChangelogsResult = await onReadingMatchingFiles({
		globPatterns: changelogGlobPatterns,
	})

	if (readChangelogsResult.status === "failed") {
		await onDisplayingMessage({
			level: "error",
			message: readChangelogsResult.errorMessage,
		})
		return 1
	}

	const readPackagesResult = await onReadingMatchingFiles({
		globPatterns: packageGlobPatterns,
	})

	if (readPackagesResult.status === "failed") {
		await onDisplayingMessage({
			level: "error",
			message: readPackagesResult.errorMessage,
		})
		return 1
	}

	if (
		readChangelogsResult.pathsWithContent.length === 0 &&
		changelogGlobPatterns.length > 0
	) {
		await onDisplayingMessage({
			level: "warning",
			message: `${changelogGlobPatterns.join(", ")} did not match any files`,
		})
	}

	if (
		readPackagesResult.pathsWithContent.length === 0 &&
		packageGlobPatterns.length > 0
	) {
		await onDisplayingMessage({
			level: "warning",
			message: `${packageGlobPatterns.join(", ")} did not match any files`,
		})
	}

	const promoteChangelogsResult = await onPromotingChangelogs({
		pathsWithContent: readChangelogsResult.pathsWithContent,
		newRelease,
	})

	const promotePackagesResult = await onPromotingPackages({
		pathsWithContent: readPackagesResult.pathsWithContent,
		newReleaseVersion: newRelease.version,
	})

	if (promoteChangelogsResult.status === "failed") {
		for (const message of promoteChangelogsResult.errors) {
			await onDisplayingMessage({ level: "error", message })
		}
	}

	if (promotePackagesResult.status === "failed") {
		for (const message of promotePackagesResult.errors) {
			await onDisplayingMessage({ level: "error", message })
		}
	}

	if (
		promoteChangelogsResult.status === "failed" ||
		promotePackagesResult.status === "failed"
	) {
		return 1
	}

	const writeChangesResult = await onWritingToFiles({
		outputPathsWithContent: [
			...promoteChangelogsResult.outputPathsWithContent,
			...promotePackagesResult.outputPathsWithContent,
		],
	})

	if (writeChangesResult.status === "failed") {
		await onDisplayingMessage({
			level: "error",
			message: writeChangesResult.errorMessage,
		})
		return 1
	}

	return 0
}
