import {
	type Configuration,
	getConfigurationFromArgs,
} from "+configuration/Configuration"
import type { SemanticVersionString } from "+utilities/StringUtilities"
import { describe, expect, it } from "vitest"

describe.each`
	argsString
	${""}
	${"--help"}
	${"--help --version"}
	${"--release-version 1.1 --help"}
	${"--files --help package.json"}
`("a configuration from $argsString", (input: { argsString: string }) => {
	const { argsString } = input
	const args = splitArgsString(argsString)

	const configuration = getConfigurationFromArgs(args)

	it("is 'help-screen'", () => {
		expect(configuration.type).toBe("help-screen")
	})
})

describe.each`
	argsString
	${"--version"}
	${"--release-version 2.2 --version"}
	${"--files --version CHANGELOG.adoc"}
`("a configuration from $argsString", (input: { argsString: string }) => {
	const { argsString } = input
	const args = splitArgsString(argsString)

	const configuration = getConfigurationFromArgs(args)

	it("is 'tool-version'", () => {
		expect(configuration.type).toBe("tool-version")
	})
})

describe.each`
	argsString                                                                              | expectedErrorMessage
	${"--file-patterns"}                                                                    | ${"Unknown option '--file-patterns'."}
	${"--release"}                                                                          | ${"Unknown option '--release'."}
	${"--check"}                                                                            | ${"Unknown option '--check'."}
	${"--help --help"}                                                                      | ${"--help must be specified only once."}
	${"--version --version"}                                                                | ${"--version must be specified only once."}
	${"--release-version 1.1.0 --release-version 2.1.0"}                                    | ${"--release-version must be specified only once."}
	${"--files packages/**/package.json packages/**/CHANGELOG.adoc --files CHANGELOG.adoc"} | ${"--files must be specified only once."}
	${"--files CHANGELOG.adoc"}                                                             | ${"--release-version must be specified."}
	${"--files CHANGELOG.adoc --release-version"}                                           | ${"--release-version must specify a value."}
	${"--files CHANGELOG.adoc --release-version 1.0.1 v1.0.2"}                              | ${"--release-version must not specify more than one value."}
	${" --files CHANGELOG.adoc --release-version 1.1"}                                      | ${"--release-version has an invalid value '1.1'."}
	${" --files CHANGELOG.adoc --release-version v2"}                                       | ${"--release-version has an invalid value 'v2'."}
	${" --files CHANGELOG.adoc --release-version next"}                                     | ${"--release-version has an invalid value 'next'."}
	${"--release-version 1.0.1"}                                                            | ${"--files must be specified."}
	${"--release-version 1.0.1 --files"}                                                    | ${"--files must specify a value."}
`(
	"a configuration from $argsString on $today",
	(input: {
		argsString: string
		expectedErrorMessage: string
	}) => {
		const { argsString, expectedErrorMessage } = input
		const args = splitArgsString(argsString)

		const configuration = getConfigurationFromArgs(args)

		it("is 'invalid'", () => {
			expect(configuration.type).toBe("invalid")
		})

		it(`has an error message of '${expectedErrorMessage}'`, () => {
			assumeInvalid(configuration)
			expect(configuration.errorMessage).toBe(expectedErrorMessage)
		})
	},
)

describe.each`
	argsString                                                                                                                             | expectedReleaseVersion    | expectedFilePatterns
	${"--release-version 1.1.0 --files CHANGELOG.adoc"}                                                                                    | ${"1.1.0"}                | ${["CHANGELOG.adoc"]}
	${"--files packages/**/package.json packages/**/*.adoc lib/package.json dist/package.json dist/*.adoc --release-version 6.0.0-beta.1"} | ${"6.0.0-beta.1"}         | ${["packages/**/package.json", "packages/**/*.adoc", "lib/package.json", "dist/package.json", "dist/*.adoc"]}
	${"--release-version v3.5.3 --files CHANGELOG.adoc package.json"}                                                                      | ${"3.5.3"}                | ${["CHANGELOG.adoc", "package.json"]}
	${"--files CHANGES.adoc lib/RELEASES.adoc lib/package.json --release-version v4.11.3-alpha+d06f00d"}                                   | ${"4.11.3-alpha+d06f00d"} | ${["CHANGES.adoc", "lib/RELEASES.adoc", "lib/package.json"]}
`(
	"a configuration from $argsString on $today",
	(input: {
		argsString: string
		expectedReleaseVersion: SemanticVersionString
		expectedFilePatterns: Array<string>
	}) => {
		const { argsString, expectedReleaseVersion, expectedFilePatterns } = input
		const args = splitArgsString(argsString)

		const configuration = getConfigurationFromArgs(args)

		it("is 'release'", () => {
			expect(configuration.type).toBe("release")
		})

		it(`has a release version of '${expectedReleaseVersion}'`, () => {
			assumeRelease(configuration)
			expect(configuration.releaseVersion).toBe(expectedReleaseVersion)
		})

		it(`has ${expectedFilePatterns.length} file pattern(s)`, () => {
			assumeRelease(configuration)
			expect(configuration.filePatterns).toStrictEqual(expectedFilePatterns)
		})
	},
)

function splitArgsString(argsString: string): Array<string> {
	return argsString
		.split(" ")
		.map((arg) => arg.trim())
		.filter((arg) => arg !== "")
}

function assumeInvalid(
	configuration: Configuration,
): asserts configuration is Configuration.Invalid {
	if (configuration.type !== "invalid") {
		// biome-ignore lint/nursery/noMisplacedAssertion: This is a test utility function.
		expect.fail(
			`Expected the configuration to be 'invalid', but it was ${configuration.type}`,
		)
	}
}

function assumeRelease(
	configuration: Configuration,
): asserts configuration is Configuration.Release {
	if (configuration.type !== "release") {
		// biome-ignore lint/nursery/noMisplacedAssertion: This is a test utility function.
		expect.fail(
			`Expected the configuration to be 'release', but it was ${configuration.type}`,
		)
	}
}
