import {
	type DateString,
	type SemanticVersionString,
} from "+utilities/string-types"
import { describe, expect, it } from "vitest"
import { getConfigurationFromArgs, type Configuration } from "./Configuration"

const dummyToday: DateString = "2022-05-29"
const dummyToolVersion: SemanticVersionString = "1.0.0"

describe.each`
	argsString
	${""}
	${"--help"}
	${"--help --version"}
	${"--changelogs CHANGELOG.adoc --help"}
	${"--packages --help package.json"}
`("when the args are $argsString", (input: { readonly argsString: string }) => {
	const { argsString } = input
	const args = splitArgsString(argsString)

	describe("deriving a configuration from args", () => {
		const configuration = getConfigurationFromArgs({
			args,
			today: dummyToday,
			toolVersion: dummyToolVersion,
		})

		it("is 'display-help-screen'", () => {
			expect(configuration.type).toBe("display-help-screen")
		})
	})
})

describe.each`
	argsString
	${"--version"}
	${"--changelogs CHANGELOG.adoc --version"}
	${"--packages --version package.json"}
`(
	"when the args are $argsString",
	(argsInput: { readonly argsString: string }) => {
		const { argsString } = argsInput
		const args = splitArgsString(argsString)

		describe.each`
			toolVersion
			${"1.1.0"}
			${"2.0.0-beta.1"}
		`(
			"deriving a configuration from args under tool version $toolVersion",
			(toolVersionInput: { readonly toolVersion: SemanticVersionString }) => {
				const { toolVersion } = toolVersionInput

				const configuration = getConfigurationFromArgs({
					args,
					today: dummyToday,
					toolVersion,
				})

				it("is 'display-tool-version'", () => {
					expect(configuration.type).toBe("display-tool-version")
				})

				it(`contains a tool version of '${toolVersion}'`, () => {
					assumeDisplayToolVersion(configuration)
					expect(configuration.toolVersion).toBe(toolVersion)
				})
			},
		)
	},
)

describe.each`
	argsString                                                                                                                            | expectedReleaseVersion    | expectedChangelogGlobPatterns            | expectedPackageGlobPatterns
	${"1.1.0"}                                                                                                                            | ${"1.1.0"}                | ${[]}                                    | ${[]}
	${"2.0.0-beta.1 --changelogs CHANGELOG.adoc"}                                                                                         | ${"2.0.0-beta.1"}         | ${["CHANGELOG.adoc"]}                    | ${[]}
	${"v3.5.3 --packages package.json"}                                                                                                   | ${"3.5.3"}                | ${[]}                                    | ${["package.json"]}
	${"4.11.3-alpha+d06f00d --changelogs CHANGES.adoc lib/RELEASES.adoc  --packages lib/package.json"}                                    | ${"4.11.3-alpha+d06f00d"} | ${["CHANGES.adoc", "lib/RELEASES.adoc"]} | ${["lib/package.json"]}
	${"v6.0.0-beta.1 --packages packages/**/package.json lib/package.json dist/package.json --changelogs packages/**/*.adoc dist/*.adoc"} | ${"6.0.0-beta.1"}         | ${["packages/**/*.adoc", "dist/*.adoc"]} | ${["packages/**/package.json", "lib/package.json", "dist/package.json"]}
`(
	"when the args are $argsString",
	(argsInput: {
		readonly argsString: string
		readonly expectedReleaseVersion: SemanticVersionString
		readonly expectedChangelogGlobPatterns: ReadonlyArray<string>
		readonly expectedPackageGlobPatterns: ReadonlyArray<string>
	}) => {
		const {
			argsString,
			expectedReleaseVersion,
			expectedChangelogGlobPatterns,
			expectedPackageGlobPatterns,
		} = argsInput
		const args = splitArgsString(argsString)

		describe.each`
			today
			${"2023-03-30"}
			${"2024-02-12"}
		`(
			"deriving a configuration from args on $today",
			(todayInput: { readonly today: DateString }) => {
				const { today } = todayInput
				const configuration = getConfigurationFromArgs({
					args,
					today,
					toolVersion: dummyToolVersion,
				})

				it("is 'prepare-release'", () => {
					expect(configuration.type).toBe("prepare-release")
				})

				it(`contains a release version of '${expectedReleaseVersion}'`, () => {
					assumePrepareRelease(configuration)
					expect(configuration.newRelease.version).toBe(expectedReleaseVersion)
				})

				it(`contains a release date of '${today}'`, () => {
					assumePrepareRelease(configuration)
					expect(configuration.newRelease.date).toBe(today)
				})

				it(`contains changelog glob patterns of [${expectedChangelogGlobPatterns}]`, () => {
					assumePrepareRelease(configuration)
					expect(configuration.changelogGlobPatterns).toStrictEqual(
						expectedChangelogGlobPatterns,
					)
				})

				it(`contains package glob patterns of [${expectedPackageGlobPatterns}]`, () => {
					assumePrepareRelease(configuration)
					expect(configuration.packageGlobPatterns).toStrictEqual(
						expectedPackageGlobPatterns,
					)
				})
			},
		)
	},
)

describe.each`
	argsString
	${"--changelogs 1.0.4 CHANGELOG.adoc"}
	${"--packages package.json lib/package.json 2.0.1"}
	${"--changelogs CHANGELOG.adoc --packages package.json"}
`("when the args are $argsString", (input: { readonly argsString: string }) => {
	const { argsString } = input
	const args = splitArgsString(argsString)

	describe("deriving a configuration from args", () => {
		const configuration = getConfigurationFromArgs({
			args,
			today: dummyToday,
			toolVersion: dummyToolVersion,
		})

		it("is 'error-release-version-missing'", () => {
			expect(configuration.type).toBe("error-release-version-missing")
		})
	})
})

describe.each`
	argsString                            | expectedProvidedReleaseVersion
	${"next --changelogs CHANGELOG.adoc"} | ${"next"}
	${"5.1 --packages package.json"}      | ${"5.1"}
	${"v2"}                               | ${"2"}
`(
	"when the args are $argsString",
	(input: {
		readonly argsString: string
		readonly expectedProvidedReleaseVersion: string
	}) => {
		const { argsString, expectedProvidedReleaseVersion } = input
		const args = splitArgsString(argsString)

		describe("deriving a configuration from args", () => {
			const configuration = getConfigurationFromArgs({
				args,
				today: dummyToday,
				toolVersion: dummyToolVersion,
			})

			it("is 'error-release-version-invalid'", () => {
				expect(configuration.type).toBe("error-release-version-invalid")
			})

			it(`contains the provided release version of '${expectedProvidedReleaseVersion}'`, () => {
				assumeErrorReleaseVersionInvalid(configuration)
				expect(configuration.providedReleaseVersion).toBe(
					expectedProvidedReleaseVersion,
				)
			})
		})
	},
)

describe.each`
	argsString
	${"0.1.7 --changelogs"}
	${"10.5.6-rc.4 --packages package.json lib/package.json --changelogs"}
	${"7.3.2 --changelogs --packages packages/**/package.json"}
	${"8.0.0+0ff1ce --packages --changelogs"}
`("when the args are $argsString", (input: { readonly argsString: string }) => {
	const { argsString } = input
	const args = splitArgsString(argsString)

	describe("deriving a configuration from args", () => {
		const configuration = getConfigurationFromArgs({
			args,
			today: dummyToday,
			toolVersion: dummyToolVersion,
		})

		it("is 'error-changelog-file-pattern-missing'", () => {
			expect(configuration.type).toBe("error-changelog-file-pattern-missing")
		})
	})
})

describe.each`
	argsString
	${"0.5.2 --changelogs CHANGELOG.adoc RELEASES.adoc --packages"}
	${"3.0.1 --packages --changelogs packages/**/CHANGELOG.adoc"}
`("when the args are $argsString", (input: { readonly argsString: string }) => {
	const { argsString } = input
	const args = splitArgsString(argsString)

	describe("deriving a configuration from args", () => {
		const configuration = getConfigurationFromArgs({
			args,
			today: dummyToday,
			toolVersion: dummyToolVersion,
		})

		it("is 'error-package-file-pattern-missing'", () => {
			expect(configuration.type).toBe("error-package-file-pattern-missing")
		})
	})
})

function splitArgsString(argsString: string): ReadonlyArray<string> {
	return argsString
		.split(" ")
		.map((arg) => arg.trim())
		.filter((arg) => arg !== "")
}

function assumeDisplayToolVersion(
	configuration: Configuration,
): asserts configuration is Configuration.DisplayToolVersion {
	if (configuration.type !== "display-tool-version") {
		expect.fail(
			`Expected 'display-tool-version', but it was ${configuration.type}`,
		)
	}
}

function assumeErrorReleaseVersionInvalid(
	configuration: Configuration,
): asserts configuration is Configuration.ErrorReleaseVersionInvalid {
	if (configuration.type !== "error-release-version-invalid") {
		expect.fail(
			`Expected 'error-release-version-invalid', but it was ${configuration.type}`,
		)
	}
}

function assumePrepareRelease(
	configuration: Configuration,
): asserts configuration is Configuration.PrepareRelease {
	if (configuration.type !== "prepare-release") {
		expect.fail(`Expected 'prepare-release', but it was ${configuration.type}`)
	}
}
