import {
	isSemanticVersionString,
	type SemanticVersionString,
} from "+utilities/StringUtilities"

export function getConfigurationFromArgs(
	args: ReadonlyArray<string>,
): Configuration {
	const parsedArgs: Record<Option, Array<string> | null> = {
		"--files": null,
		"--help": null,
		"--release-version": null,
		"--version": null,
	}
	let currentOption: Option | null = null

	for (const arg of args) {
		if (isOption(arg)) {
			if (parsedArgs[arg] !== null) {
				return invalid({ message: `${arg} must be specified only once.` })
			}
			currentOption = arg
			parsedArgs[currentOption] = [] as Array<string>
			continue
		}
		if (arg.startsWith("-")) {
			return invalid({ message: `Unknown option '${arg}'.` })
		}
		if (currentOption !== null) {
			parsedArgs[currentOption]?.push(arg)
		}
	}

	if (args.length === 0 || parsedArgs["--help"] !== null) {
		return helpScreen()
	}
	if (parsedArgs["--version"] !== null) {
		return toolVersion()
	}

	const rawReleaseVersions = parsedArgs["--release-version"]

	if (rawReleaseVersions === null) {
		return invalid({ message: "--release-version must be specified." })
	}
	if (rawReleaseVersions.length === 0) {
		return invalid({ message: "--release-version must specify a value." })
	}
	if (rawReleaseVersions.length > 1) {
		return invalid({
			message: "--release-version must not specify more than one value.",
		})
	}

	const rawReleaseVersion = rawReleaseVersions[0]

	const releaseVersion = rawReleaseVersion.startsWith("v")
		? rawReleaseVersion.slice(1)
		: rawReleaseVersion

	if (!isSemanticVersionString(releaseVersion)) {
		return invalid({
			message: `--release-version has an invalid value '${rawReleaseVersion}'.`,
		})
	}

	const files = parsedArgs["--files"]

	if (files === null) {
		return invalid({ message: "--files must be specified." })
	}
	if (files.length === 0) {
		return invalid({ message: "--files must specify a value." })
	}

	return release({ files, releaseVersion })
}

const options = ["--files", "--help", "--release-version", "--version"] as const

type Option = (typeof options)[number]

function isOption(arg: string): arg is Option {
	return (options as ReadonlyArray<string>).includes(arg)
}

export type Configuration =
	| Configuration.HelpScreen
	| Configuration.Invalid
	| Configuration.Release
	| Configuration.ToolVersion

export namespace Configuration {
	export type HelpScreen = {
		readonly type: "help-screen"
	}

	export type Invalid = {
		readonly type: "invalid"
		readonly errorMessage: string
	}

	export type Release = {
		readonly type: "release"
		readonly filePatterns: ReadonlyArray<string>
		readonly releaseVersion: SemanticVersionString
	}

	export type ToolVersion = {
		readonly type: "tool-version"
	}
}

function helpScreen(): Configuration.HelpScreen {
	return { type: "help-screen" }
}

function invalid(input: { readonly message: string }): Configuration.Invalid {
	const { message } = input
	return { type: "invalid", errorMessage: message }
}

function release(input: {
	readonly files: Array<string>
	readonly releaseVersion: SemanticVersionString
}): Configuration.Release {
	const { files, releaseVersion } = input
	return { type: "release", filePatterns: files, releaseVersion }
}

function toolVersion(): Configuration.ToolVersion {
	return { type: "tool-version" }
}
