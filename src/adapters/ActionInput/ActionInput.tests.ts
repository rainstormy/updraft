import { beforeEach, describe, expect, it, vi } from "vitest"
import { getArgsFromActionInput } from "#adapters/ActionInput/ActionInput"

describe.each`
	checkSequentialRelease | files                                                            | prereleaseFiles                                     | releaseFiles                                        | releaseVersion              | expectedArgs
	${"false"}             | ${""}                                                            | ${""}                                               | ${""}                                               | ${"1.0.0"}                  | ${["--release-version", "1.0.0"]}
	${"true"}              | ${"package.json"}                                                | ${""}                                               | ${""}                                               | ${"1.0.0"}                  | ${["--check-sequential-release", "--files", "package.json", "--release-version", "1.0.0"]}
	${"FALSE"}             | ${"CHANGELOG.md"}                                                | ${""}                                               | ${""}                                               | ${"0.0.1"}                  | ${["--files", "CHANGELOG.md", "--release-version", "0.0.1"]}
	${"TRUE"}              | ${"CHANGELOG.adoc package.json"}                                 | ${""}                                               | ${""}                                               | ${"1.1.0-beta.1"}           | ${["--check-sequential-release", "--files", "CHANGELOG.adoc", "package.json", "--release-version", "1.1.0-beta.1"]}
	${"off"}               | ${"    packages/**/package.json\n    CHANGELOG.md"}              | ${""}                                               | ${""}                                               | ${"1.2.7"}                  | ${["--files", "packages/**/package.json", "CHANGELOG.md", "--release-version", "1.2.7"]}
	${"on"}                | ${""}                                                            | ${"CHANGELOG.md"}                                   | ${""}                                               | ${"0.1.4"}                  | ${["--check-sequential-release", "--prerelease-files", "CHANGELOG.md", "--release-version", "0.1.4"]}
	${"no"}                | ${""}                                                            | ${"CHANGELOG.adoc package.json"}                    | ${""}                                               | ${"2.0.0+69c1219f"}         | ${["--prerelease-files", "CHANGELOG.adoc", "package.json", "--release-version", "2.0.0+69c1219f"]}
	${"yes"}               | ${""}                                                            | ${"    packages/**/package.json\n    CHANGELOG.md"} | ${""}                                               | ${"10.6.0"}                 | ${["--check-sequential-release", "--prerelease-files", "packages/**/package.json", "CHANGELOG.md", "--release-version", "10.6.0"]}
	${"NO"}                | ${""}                                                            | ${""}                                               | ${"CHANGELOG.md"}                                   | ${"0.7.6"}                  | ${["--release-files", "CHANGELOG.md", "--release-version", "0.7.6"]}
	${"YES"}               | ${""}                                                            | ${""}                                               | ${"CHANGELOG.adoc package.json"}                    | ${"1.5.0-rc.0+203a1747"}    | ${["--check-sequential-release", "--release-files", "CHANGELOG.adoc", "package.json", "--release-version", "1.5.0-rc.0+203a1747"]}
	${"False"}             | ${""}                                                            | ${""}                                               | ${"    packages/**/package.json\n    CHANGELOG.md"} | ${"6.2.0"}                  | ${["--release-files", "packages/**/package.json", "CHANGELOG.md", "--release-version", "6.2.0"]}
	${"True"}              | ${"package.json\n\nlib/package.json"}                            | ${"dist/package.json"}                              | ${""}                                               | ${"v3.4.1"}                 | ${["--check-sequential-release", "--files", "package.json", "lib/package.json", "--prerelease-files", "dist/package.json", "--release-version", "v3.4.1"]}
	${"No"}                | ${"packages/apples/package.json\npackages/oranges/package.json"} | ${""}                                               | ${"CHANGELOG.md"}                                   | ${"5.0.0-alpha.3"}          | ${["--files", "packages/apples/package.json", "packages/oranges/package.json", "--release-files", "CHANGELOG.md", "--release-version", "5.0.0-alpha.3"]}
	${"Yes"}               | ${"packages/**/package.json"}                                    | ${"    dist/package.json\n    dist/CHANGELOG.md"}   | ${"CHANGELOG.md packages/**/CHANGELOG.md"}          | ${"2.4.0"}                  | ${["--check-sequential-release", "--files", "packages/**/package.json", "--prerelease-files", "dist/package.json", "dist/CHANGELOG.md", "--release-files", "CHANGELOG.md", "packages/**/CHANGELOG.md", "--release-version", "2.4.0"]}
	${""}                  | ${""}                                                            | ${"package.json"}                                   | ${"CHANGELOG.adoc CHANGELOG.md"}                    | ${"release/1.1.5+f699bd05"} | ${["--prerelease-files", "package.json", "--release-files", "CHANGELOG.adoc", "CHANGELOG.md", "--release-version", "release/1.1.5+f699bd05"]}
`(
	"when the action input is check-sequential-release: $checkSequentialRelease, files: $files, prerelease-files: $prereleaseFiles, release-files: $releaseFiles, release-version: $releaseVersion",
	(props: {
		checkSequentialRelease: string
		files: string
		prereleaseFiles: string
		releaseFiles: string
		releaseVersion: string
		expectedArgs: Array<string>
	}) => {
		let actualArgs: Array<string>

		beforeEach(() => {
			vi.stubEnv("INPUT_CHECK-SEQUENTIAL-RELEASE", props.checkSequentialRelease)
			vi.stubEnv("INPUT_FILES", props.files)
			vi.stubEnv("INPUT_PRERELEASE-FILES", props.prereleaseFiles)
			vi.stubEnv("INPUT_RELEASE-FILES", props.releaseFiles)
			vi.stubEnv("INPUT_RELEASE-VERSION", props.releaseVersion)

			actualArgs = getArgsFromActionInput()
		})

		it(`returns '${props.expectedArgs.join(" ")}'`, () => {
			expect(actualArgs).toEqual(props.expectedArgs)
		})
	},
)
