import type { DateString, SemanticVersionString } from "+utilities"
import { isSemanticVersionString } from "+utilities"

export type Configuration =
	| Configuration.DisplayHelpScreen
	| Configuration.DisplayToolVersion
	| Configuration.ErrorChangeLogFilePatternMissing
	| Configuration.ErrorPackageFilePatternMissing
	| Configuration.ErrorReleaseVersionMissing
	| Configuration.ErrorReleaseVersionInvalid
	| Configuration.PrepareRelease

export namespace Configuration {
	export type DisplayHelpScreen = {
		readonly type: "display-help-screen"
	}

	export type DisplayToolVersion = {
		readonly type: "display-tool-version"
		readonly toolVersion: SemanticVersionString
	}

	export type ErrorChangeLogFilePatternMissing = {
		readonly type: "error-changelog-file-pattern-missing"
	}

	export type ErrorPackageFilePatternMissing = {
		readonly type: "error-package-file-pattern-missing"
	}

	export type ErrorReleaseVersionInvalid = {
		readonly type: "error-release-version-invalid"
		readonly providedReleaseVersion: string
	}

	export type ErrorReleaseVersionMissing = {
		readonly type: "error-release-version-missing"
	}

	export type PrepareRelease = {
		readonly type: "prepare-release"
		readonly changelogGlobPatterns: ReadonlyArray<string>
		readonly packageGlobPatterns: ReadonlyArray<string>
		readonly release: {
			readonly date: DateString
			readonly version: SemanticVersionString
		}
	}
}

export function getConfigurationFromArgs(input: {
	readonly args: ReadonlyArray<string>
	readonly today: DateString
	readonly toolVersion: SemanticVersionString
}): Configuration {
	const { args, today, toolVersion } = input

	function getOptionArguments(name: string): ReadonlyArray<string> | null {
		const optionIndex = args.indexOf(name)

		if (optionIndex === -1) {
			return null
		}

		const nextOptionIndex = args.findIndex(
			(arg, index) => index > optionIndex && arg.startsWith("--"),
		)

		return nextOptionIndex === -1
			? args.slice(optionIndex + 1)
			: args.slice(optionIndex + 1, nextOptionIndex)
	}

	if (args.length === 0 || getOptionArguments("--help") !== null) {
		return { type: "display-help-screen" }
	}

	if (getOptionArguments("--version") !== null) {
		return {
			type: "display-tool-version",
			toolVersion: toolVersion,
		}
	}

	const releaseVersion = args[0].startsWith("v") ? args[0].slice(1) : args[0]

	if (releaseVersion.startsWith("--")) {
		return { type: "error-release-version-missing" }
	}
	if (!isSemanticVersionString(releaseVersion)) {
		return {
			type: "error-release-version-invalid",
			providedReleaseVersion: releaseVersion,
		}
	}

	const changelogGlobPatterns = getOptionArguments("--changelogs")

	if (changelogGlobPatterns?.length === 0) {
		return { type: "error-changelog-file-pattern-missing" }
	}

	const packageGlobPatterns = getOptionArguments("--packages")

	if (packageGlobPatterns?.length === 0) {
		return { type: "error-package-file-pattern-missing" }
	}

	return {
		type: "prepare-release",
		changelogGlobPatterns: changelogGlobPatterns ?? [],
		packageGlobPatterns: packageGlobPatterns ?? [],
		release: {
			date: today,
			version: releaseVersion as SemanticVersionString,
		},
	}
}
