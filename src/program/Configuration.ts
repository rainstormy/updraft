import { assertError } from "+utilities/ErrorUtilities"
import {
	type SemanticVersionString,
	isSemanticVersionString,
} from "+utilities/StringUtilities"

export function getConfigurationFromArgs(args: Array<string>): Configuration {
	try {
		const parsedArgs = parseArgs(args)

		if (args.length === 0 || parsedArgs["--help"] !== null) {
			return helpScreen()
		}
		if (parsedArgs["--version"] !== null) {
			return toolVersion()
		}

		const rawReleaseVersions = parsedArgs["--release-version"]

		if (rawReleaseVersions === null) {
			return invalid("--release-version must be specified.")
		}
		if (rawReleaseVersions.length === 0) {
			return invalid("--release-version must specify a value.")
		}
		if (rawReleaseVersions.length > 1) {
			return invalid("--release-version must not specify more than one value.")
		}

		const rawReleaseVersion = rawReleaseVersions[0]

		const releaseVersion = rawReleaseVersion.startsWith("v")
			? rawReleaseVersion.slice(1)
			: rawReleaseVersion

		if (!isSemanticVersionString(releaseVersion)) {
			return invalid(
				`--release-version has an invalid value '${rawReleaseVersion}'.`,
			)
		}

		const files = parsedArgs["--files"]

		if (files === null) {
			return invalid("--files must be specified.")
		}
		if (files.length === 0) {
			return invalid("--files must specify a value.")
		}
		return release(files, releaseVersion)
	} catch (error) {
		assertError(error)
		return invalid(error.message)
	}
}

type ParsedArgs = Record<Option, Array<string> | null>

function parseArgs(args: Array<string>): ParsedArgs {
	const parsedArgs: ParsedArgs = {
		"--files": null,
		"--help": null,
		"--release-version": null,
		"--version": null,
	}
	let currentOption: Option | null = null

	for (const arg of args) {
		if (isOption(arg)) {
			if (parsedArgs[arg] !== null) {
				throw new Error(`${arg} must be specified only once.`)
			}
			currentOption = arg
			parsedArgs[currentOption] = [] as Array<string>
			continue
		}
		if (arg.startsWith("-")) {
			throw new Error(`Unknown option '${arg}'.`)
		}
		if (currentOption !== null) {
			parsedArgs[currentOption]?.push(arg)
		}
	}

	return parsedArgs
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
		type: "help-screen"
	}

	export type Invalid = {
		type: "invalid"
		errorMessage: string
	}

	export type Release = {
		type: "release"
		filePatterns: Array<string>
		releaseVersion: SemanticVersionString
	}

	export type ToolVersion = {
		type: "tool-version"
	}
}

function helpScreen(): Configuration.HelpScreen {
	return { type: "help-screen" }
}

function invalid(message: string): Configuration.Invalid {
	return { type: "invalid", errorMessage: message }
}

function release(
	files: Array<string>,
	releaseVersion: SemanticVersionString,
): Configuration.Release {
	return { type: "release", filePatterns: files, releaseVersion }
}

function toolVersion(): Configuration.ToolVersion {
	return { type: "tool-version" }
}
