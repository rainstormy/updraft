// Mock injection imports must be at the top, separated from the regular imports by a blank line.
import { injectFileSystemMock } from "+adapters/FileSystem/FileSystem.mock"
import { injectLoggerMock } from "+adapters/Logger/Logger.mock"
import { injectTodayMock } from "+adapters/Today/Today.mock"

import type { Files } from "+adapters/FileSystem/File"
import { mainProgram } from "+program/Program"
import {
	aNonPromotableAsciidocChangelog,
	aNonPromotableMarkdownChangelog,
	aNonPromotablePackageJson,
	aPromotableAsciidocChangelogA,
	aPromotableAsciidocChangelogB,
	aPromotableAsciidocChangelogC,
	aPromotableAsciidocChangelogD,
	aPromotableMarkdownChangelogA,
	aPromotableMarkdownChangelogB,
	aPromotableMarkdownChangelogC,
	aPromotableMarkdownChangelogD,
	aPromotablePackageJsonA,
	aPromotablePackageJsonB,
	aPromotablePackageJsonC,
	aPromotablePackageJsonD,
	aPromotedAsciidocChangelogA,
	aPromotedAsciidocChangelogB,
	aPromotedAsciidocChangelogC,
	aPromotedAsciidocChangelogD,
	aPromotedMarkdownChangelogA,
	aPromotedMarkdownChangelogB,
	aPromotedMarkdownChangelogC,
	aPromotedMarkdownChangelogD,
	aPromotedPackageJsonA,
	aPromotedPackageJsonB,
	aPromotedPackageJsonC,
	aPromotedPackageJsonD,
	anEmptyAsciidocChangelog,
	anEmptyMarkdownChangelog,
	anEmptyPackageJson,
	anUnsupportedFileA,
	anUnsupportedFileB,
} from "+program/PromotionProgram/PromotionProgram.testdata"
import type { ExitCode } from "+utilities/ErrorUtilities"
import type { DateString } from "+utilities/StringUtilities"
import { beforeEach, describe, expect, it } from "vitest"

const { today } = injectTodayMock()
const { printMessage, printWarning, printError } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

describe.each`
	today           | args                                                                                                           | expectedWarning
	${"2017-11-14"} | ${"--files CHANGELOG.adoc --release-version 0.6.0"}                                                            | ${"CHANGELOG.adoc did not match any files."}
	${"2018-06-26"} | ${"--files lib/package.json lib/CHANGELOG.md --release-version 1.0.4-beta.1"}                                  | ${"lib/package.json, lib/CHANGELOG.md did not match any files."}
	${"2019-05-18"} | ${"--files CHANGELOG.md packages/**/package.json packages/**/CHANGELOG.md --release-version 2.2.3"}            | ${"CHANGELOG.md, packages/**/package.json, packages/**/CHANGELOG.md did not match any files."}
	${"2020-04-21"} | ${"--files **/CHANGELOG.adoc **/package.json --release-version 6.2.1"}                                         | ${"**/CHANGELOG.adoc, **/package.json did not match any files."}
	${"2021-09-24"} | ${"--files dist/CHANGELOG.md dist/package.json --release-version 11.4.0"}                                      | ${"dist/CHANGELOG.md, dist/package.json did not match any files."}
	${"2022-08-16"} | ${"--files package.json **/CHANGELOG.md --release-version 2.6.0-rc.0+ed7e32ad"}                                | ${"package.json, **/CHANGELOG.md did not match any files."}
	${"2023-03-03"} | ${"--files packages/**/package.json CHANGELOG.md packages/**/CHANGELOG.adoc --release-version 3.6.1+39609b2e"} | ${"packages/**/package.json, CHANGELOG.md, packages/**/CHANGELOG.adoc did not match any files."}
`(
	"when there are no matching files: $args",
	(props: {
		today: DateString
		args: string
		expectedWarning: string
	}) => {
		let actualExitCode: ExitCode

		beforeEach(async () => {
			today.mockImplementation(() => props.today)
			readMatchingFiles.mockImplementation(async () => []) // No matched files.
			actualExitCode = await mainProgram(props.args.split(" "))
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("displays a warning", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
			expect(printWarning).toHaveBeenCalledWith(props.expectedWarning)
			expect(printWarning).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	today           | args                                                                                   | files                                                                                                                                                                                                                                                   | expectedErrors
	${"2017-01-02"} | ${"--files changelog.txt --release-version 0.9.1"}                                     | ${[anUnsupportedFileA("changelog.txt")]}                                                                                                                                                                                                                | ${["changelog.txt is not a supported file format."]}
	${"2017-01-22"} | ${"--files CHANGES --release-version 1.5.0-beta.3"}                                    | ${[anUnsupportedFileB("CHANGES")]}                                                                                                                                                                                                                      | ${["CHANGES is not a supported file format."]}
	${"2017-02-04"} | ${"--files packages/**/* --release-version 2.1.0"}                                     | ${[aPromotablePackageJsonA("packages/apples/package.json"), anUnsupportedFileA("packages/apples/RELEASES"), aPromotablePackageJsonB("packages/bananas/package.json"), anUnsupportedFileB("packages/bananas/releases.txt")]}                             | ${["packages/apples/RELEASES is not a supported file format.", "packages/bananas/releases.txt is not a supported file format."]}
	${"2017-03-23"} | ${"--files CHANGELOG.adoc --release-version 1.0.0"}                                    | ${[anEmptyAsciidocChangelog("CHANGELOG.adoc")]}                                                                                                                                                                                                         | ${["CHANGELOG.adoc must have an 'Unreleased' section."]}
	${"2017-04-15"} | ${"--files lib/CHANGELOG.md --release-version 1.0.1-beta.1"}                           | ${[anEmptyMarkdownChangelog("lib/CHANGELOG.md")]}                                                                                                                                                                                                       | ${["lib/CHANGELOG.md must have an 'Unreleased' section."]}
	${"2017-06-11"} | ${"--files package.json --release-version 1.1.0"}                                      | ${[anEmptyPackageJson("package.json")]}                                                                                                                                                                                                                 | ${["package.json must have a 'version' field."]}
	${"2017-07-03"} | ${"--files **/CHANGELOG.adoc **/package.json --release-version 2.3.0+7855b307"}        | ${[aPromotablePackageJsonA("dist/package.json"), anEmptyAsciidocChangelog("dist/CHANGELOG.adoc")]}                                                                                                                                                      | ${["dist/CHANGELOG.adoc must have an 'Unreleased' section."]}
	${"2017-08-15"} | ${"--files CHANGELOG.md package.json --release-version 3.3.4"}                         | ${[anEmptyMarkdownChangelog("CHANGELOG.md"), aPromotablePackageJsonA("package.json")]}                                                                                                                                                                  | ${["CHANGELOG.md must have an 'Unreleased' section."]}
	${"2017-08-21"} | ${"--files packages/**/package.json --release-version 6.2.1-rc.2+e4e4fd54"}            | ${[aPromotablePackageJsonB("packages/apples/package.json"), anEmptyPackageJson("packages/bananas/package.json"), aPromotablePackageJsonC("packages/peaches/package.json")]}                                                                             | ${["packages/bananas/package.json must have a 'version' field."]}
	${"2017-09-01"} | ${"--files docs/**/CHANGELOG.adoc --release-version 0.1.4"}                            | ${[aNonPromotableAsciidocChangelog("docs/apples/CHANGELOG.adoc"), aNonPromotableAsciidocChangelog("docs/bananas/CHANGELOG.adoc"), aNonPromotableAsciidocChangelog("docs/cranberries/CHANGELOG.adoc")]}                                                  | ${["docs/apples/CHANGELOG.adoc must have at least one item in the 'Unreleased' section.", "docs/bananas/CHANGELOG.adoc must have at least one item in the 'Unreleased' section.", "docs/cranberries/CHANGELOG.adoc must have at least one item in the 'Unreleased' section."]}
	${"2017-09-04"} | ${"--files build/CHANGELOG.md --release-version 1.12.0+2536770a"}                      | ${[aNonPromotableMarkdownChangelog("build/CHANGELOG.md")]}                                                                                                                                                                                              | ${["build/CHANGELOG.md must have at least one item in the 'Unreleased' section."]}
	${"2017-10-11"} | ${"--files out/package.json --release-version 2.0.20-next"}                            | ${[aNonPromotablePackageJson("out/package.json")]}                                                                                                                                                                                                      | ${["out/package.json must have a 'version' field."]}
	${"2017-10-22"} | ${"--files package.json CHANGELOG.adoc --release-version 0.11.0-alpha.1+2c327c8c"}     | ${[aPromotablePackageJsonA("package.json"), aNonPromotableAsciidocChangelog("CHANGELOG.adoc")]}                                                                                                                                                         | ${["CHANGELOG.adoc must have at least one item in the 'Unreleased' section."]}
	${"2017-10-31"} | ${"--files packages/**/CHANGELOG.md packages/**/package.json --release-version 5.0.0"} | ${[aPromotableMarkdownChangelogA("packages/apples/CHANGELOG.md"), aPromotablePackageJsonB("packages/apples/package.json"), aNonPromotableMarkdownChangelog("packages/oranges/CHANGELOG.md"), aPromotablePackageJsonB("packages/oranges/package.json")]} | ${["packages/oranges/CHANGELOG.md must have at least one item in the 'Unreleased' section."]}
	${"2017-11-18"} | ${"--files package.json CHANGELOG.md --release-version 8.3.3"}                         | ${[aPromotableMarkdownChangelogC("CHANGELOG.md"), aNonPromotablePackageJson("package.json")]}                                                                                                                                                           | ${["package.json must have a 'version' field."]}
	${"2017-12-14"} | ${"--files CHANGELOG.adoc package.json --release-version 9.0.0"}                       | ${[anEmptyAsciidocChangelog("CHANGELOG.adoc"), aNonPromotablePackageJson("package.json")]}                                                                                                                                                              | ${["CHANGELOG.adoc must have an 'Unreleased' section.", "package.json must have a 'version' field."]}
	${"2017-12-27"} | ${"--files **/CHANGELOG.md **/package.json --release-version 9.1.0"}                   | ${[anEmptyMarkdownChangelog("packages/apples/CHANGELOG.md"), aNonPromotableMarkdownChangelog("packages/oranges/CHANGELOG.md"), aNonPromotablePackageJson("packages/oranges/package.json"), anEmptyPackageJson("packages/peaches/package.json")]}        | ${["packages/apples/CHANGELOG.md must have an 'Unreleased' section.", "packages/oranges/CHANGELOG.md must have at least one item in the 'Unreleased' section.", "packages/oranges/package.json must have a 'version' field.", "packages/peaches/package.json must have a 'version' field."]}
`(
	"when at least one matching file cannot be promoted: $args",
	(props: {
		today: DateString
		args: string
		files: Files
		expectedErrors: Array<string>
	}) => {
		let actualExitCode: ExitCode

		beforeEach(async () => {
			today.mockImplementation(() => props.today)
			readMatchingFiles.mockImplementation(async () => props.files)
			actualExitCode = await mainProgram(props.args.split(" "))
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it(`displays ${props.expectedErrors.length} error(s)`, () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			for (const [index, expectedError] of props.expectedErrors.entries()) {
				expect(printError).toHaveBeenNthCalledWith(index + 1, expectedError)
			}
			expect(printError).toHaveBeenCalledTimes(props.expectedErrors.length)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	today           | args                                                                                   | files                                                                                                                                                                                                                                                  | expectedSavedFiles
	${"2017-03-23"} | ${"--files CHANGELOG.adoc --release-version 1.0.0"}                                    | ${[aPromotableAsciidocChangelogA("CHANGELOG.adoc")]}                                                                                                                                                                                                   | ${[aPromotedAsciidocChangelogA("CHANGELOG.adoc", "1.0.0", "2017-03-23")]}
	${"2017-04-15"} | ${"--files lib/CHANGELOG.md --release-version 1.0.1-beta.1"}                           | ${[aPromotableMarkdownChangelogA("lib/CHANGELOG.md")]}                                                                                                                                                                                                 | ${[aPromotedMarkdownChangelogA("lib/CHANGELOG.md", "1.0.1-beta.1", "2017-04-15")]}
	${"2017-06-11"} | ${"--files package.json --release-version 1.1.0"}                                      | ${[aPromotablePackageJsonA("package.json")]}                                                                                                                                                                                                           | ${[aPromotedPackageJsonA("package.json", "1.1.0")]}
	${"2017-07-03"} | ${"--files **/CHANGELOG.adoc **/package.json --release-version 2.3.0+7855b307"}        | ${[aPromotablePackageJsonA("dist/package.json"), aPromotableAsciidocChangelogA("dist/CHANGELOG.adoc")]}                                                                                                                                                | ${[aPromotedPackageJsonA("dist/package.json", "2.3.0+7855b307"), aPromotedAsciidocChangelogA("dist/CHANGELOG.adoc", "2.3.0+7855b307", "2017-07-03")]}
	${"2017-08-15"} | ${"--files CHANGELOG.md package.json --release-version 3.3.4"}                         | ${[aPromotableMarkdownChangelogC("CHANGELOG.md"), aPromotablePackageJsonC("package.json")]}                                                                                                                                                            | ${[aPromotedMarkdownChangelogC("CHANGELOG.md", "3.3.4", "2017-08-15"), aPromotedPackageJsonC("package.json", "3.3.4")]}
	${"2017-08-21"} | ${"--files packages/**/package.json --release-version 6.2.1-rc.2+e4e4fd54"}            | ${[aPromotablePackageJsonA("packages/apples/package.json"), aPromotablePackageJsonB("packages/oranges/package.json"), aPromotablePackageJsonC("packages/peaches/package.json")]}                                                                       | ${[aPromotedPackageJsonA("packages/apples/package.json", "6.2.1-rc.2+e4e4fd54"), aPromotedPackageJsonB("packages/oranges/package.json", "6.2.1-rc.2+e4e4fd54"), aPromotedPackageJsonC("packages/peaches/package.json", "6.2.1-rc.2+e4e4fd54")]}
	${"2017-09-01"} | ${"--files docs/**/CHANGELOG.adoc --release-version 0.1.4"}                            | ${[aPromotableAsciidocChangelogA("docs/apples/CHANGELOG.adoc"), aPromotableAsciidocChangelogB("docs/bananas/CHANGELOG.adoc"), aPromotableAsciidocChangelogC("docs/cranberries/CHANGELOG.adoc")]}                                                       | ${[aPromotedAsciidocChangelogA("docs/apples/CHANGELOG.adoc", "0.1.4", "2017-09-01"), aPromotedAsciidocChangelogB("docs/bananas/CHANGELOG.adoc", "0.1.4", "2017-09-01"), aPromotedAsciidocChangelogC("docs/cranberries/CHANGELOG.adoc", "0.1.4", "2017-09-01")]}
	${"2017-09-04"} | ${"--files build/CHANGELOG.md --release-version 1.12.0+2536770a"}                      | ${[aPromotableMarkdownChangelogA("build/CHANGELOG.md")]}                                                                                                                                                                                               | ${[aPromotedMarkdownChangelogA("build/CHANGELOG.md", "1.12.0+2536770a", "2017-09-04")]}
	${"2017-10-11"} | ${"--files out/package.json --release-version 2.0.20-next"}                            | ${[aPromotablePackageJsonA("out/package.json")]}                                                                                                                                                                                                       | ${[aPromotedPackageJsonA("out/package.json", "2.0.20-next")]}
	${"2017-10-22"} | ${"--files package.json CHANGELOG.adoc --release-version 0.11.0-alpha.1+2c327c8c"}     | ${[aPromotablePackageJsonA("package.json"), aPromotableAsciidocChangelogA("CHANGELOG.adoc")]}                                                                                                                                                          | ${[aPromotedPackageJsonA("package.json", "0.11.0-alpha.1+2c327c8c"), aPromotedAsciidocChangelogA("CHANGELOG.adoc", "0.11.0-alpha.1+2c327c8c", "2017-10-22")]}
	${"2017-10-31"} | ${"--files packages/**/CHANGELOG.md packages/**/package.json --release-version 5.0.0"} | ${[aPromotableMarkdownChangelogA("packages/apples/CHANGELOG.md"), aPromotablePackageJsonB("packages/apples/package.json"), aPromotableMarkdownChangelogC("packages/oranges/CHANGELOG.md"), aPromotablePackageJsonC("packages/oranges/package.json")]}  | ${[aPromotedMarkdownChangelogA("packages/apples/CHANGELOG.md", "5.0.0", "2017-10-31"), aPromotedPackageJsonB("packages/apples/package.json", "5.0.0"), aPromotedMarkdownChangelogC("packages/oranges/CHANGELOG.md", "5.0.0", "2017-10-31"), aPromotedPackageJsonC("packages/oranges/package.json", "5.0.0")]}
	${"2017-11-14"} | ${"--files CHANGELOG.adoc CHANGELOG.md package.json --release-version 8.3.3"}          | ${[aPromotableAsciidocChangelogA("CHANGELOG.adoc"), aPromotableMarkdownChangelogB("CHANGELOG.md"), aPromotablePackageJsonC("package.json")]}                                                                                                           | ${[aPromotedAsciidocChangelogA("CHANGELOG.adoc", "8.3.3", "2017-11-14"), aPromotedMarkdownChangelogB("CHANGELOG.md", "8.3.3", "2017-11-14"), aPromotedPackageJsonC("package.json", "8.3.3")]}
	${"2017-11-18"} | ${"--files dist/package.json dist/CHANGELOG.md --release-version 2.0.6-alpha.0"}       | ${[aPromotableMarkdownChangelogB("dist/CHANGELOG.md"), aPromotablePackageJsonD("dist/package.json")]}                                                                                                                                                  | ${[aPromotedMarkdownChangelogB("dist/CHANGELOG.md", "2.0.6-alpha.0", "2017-11-18"), aPromotedPackageJsonD("dist/package.json", "2.0.6-alpha.0")]}
	${"2017-12-14"} | ${"--files CHANGELOG.adoc package.json --release-version 9.0.0"}                       | ${[aPromotableAsciidocChangelogD("CHANGELOG.adoc"), aPromotablePackageJsonD("package.json")]}                                                                                                                                                          | ${[aPromotedAsciidocChangelogD("CHANGELOG.adoc", "9.0.0", "2017-12-14"), aPromotedPackageJsonD("package.json", "9.0.0")]}
	${"2017-12-27"} | ${"--files **/CHANGELOG.md **/package.json --release-version 9.1.0"}                   | ${[aPromotableMarkdownChangelogB("packages/apples/CHANGELOG.md"), aPromotableMarkdownChangelogD("packages/oranges/CHANGELOG.md"), aPromotablePackageJsonB("packages/oranges/package.json"), aPromotablePackageJsonD("packages/peaches/package.json")]} | ${[aPromotedMarkdownChangelogB("packages/apples/CHANGELOG.md", "9.1.0", "2017-12-27"), aPromotedMarkdownChangelogD("packages/oranges/CHANGELOG.md", "9.1.0", "2017-12-27"), aPromotedPackageJsonB("packages/oranges/package.json", "9.1.0"), aPromotedPackageJsonD("packages/peaches/package.json", "9.1.0")]}
`(
	"when all matching files can be promoted: $args",
	(props: {
		today: DateString
		args: string
		files: Files
		expectedSavedFiles: Files
	}) => {
		let actualExitCode: ExitCode

		beforeEach(async () => {
			today.mockImplementation(() => props.today)
			readMatchingFiles.mockImplementation(async () => props.files)
			actualExitCode = await mainProgram(props.args.split(" "))
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it("remains silent", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
		})

		it("saves the promoted files", () => {
			expect(writeFiles).toHaveBeenCalledWith(props.expectedSavedFiles)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	today           | args                                                                       | files                                                                                                                                                                                                                                            | expectedWarnings                                                                                                                                                                                            | expectedSavedFiles
	${"2017-03-23"} | ${"--files *.adoc --release-version 1.0.0"}                                | ${[aPromotableAsciidocChangelogA("HISTORY.adoc")]}                                                                                                                                                                                               | ${["HISTORY.adoc is not a supported filename and must be renamed to CHANGELOG.adoc in Updraft v2.0.0."]}                                                                                                    | ${[aPromotedAsciidocChangelogA("HISTORY.adoc", "1.0.0", "2017-03-23")]}
	${"2017-04-15"} | ${"--files lib/*.md --release-version 1.0.1-beta.1"}                       | ${[aPromotableMarkdownChangelogA("lib/RELEASES.md")]}                                                                                                                                                                                            | ${["lib/RELEASES.md is not a supported filename and must be renamed to lib/CHANGELOG.md in Updraft v2.0.0."]}                                                                                               | ${[aPromotedMarkdownChangelogA("lib/RELEASES.md", "1.0.1-beta.1", "2017-04-15")]}
	${"2017-10-22"} | ${"--files package.json *.adoc --release-version 0.11.0-alpha.1+2c327c8c"} | ${[aPromotablePackageJsonA("package.json"), aPromotableAsciidocChangelogA("CHANGES.adoc")]}                                                                                                                                                      | ${["CHANGES.adoc is not a supported filename and must be renamed to CHANGELOG.adoc in Updraft v2.0.0."]}                                                                                                    | ${[aPromotedPackageJsonA("package.json", "0.11.0-alpha.1+2c327c8c"), aPromotedAsciidocChangelogA("CHANGES.adoc", "0.11.0-alpha.1+2c327c8c", "2017-10-22")]}
	${"2017-11-14"} | ${"--files *.adoc *.md package.json --release-version 8.3.3"}              | ${[aPromotableAsciidocChangelogA("RELEASES.adoc"), aPromotableMarkdownChangelogB("RELEASES.md"), aPromotablePackageJsonC("package.json")]}                                                                                                       | ${["RELEASES.adoc is not a supported filename and must be renamed to CHANGELOG.adoc in Updraft v2.0.0.", "RELEASES.md is not a supported filename and must be renamed to CHANGELOG.md in Updraft v2.0.0."]} | ${[aPromotedAsciidocChangelogA("RELEASES.adoc", "8.3.3", "2017-11-14"), aPromotedMarkdownChangelogB("RELEASES.md", "8.3.3", "2017-11-14"), aPromotedPackageJsonC("package.json", "8.3.3")]}
	${"2017-12-27"} | ${"--files **/*.md **/package.json --release-version 9.1.0"}               | ${[aPromotableMarkdownChangelogB("packages/apples/LOG.md"), aPromotableMarkdownChangelogD("packages/oranges/CHANGELOG.md"), aPromotablePackageJsonB("packages/oranges/package.json"), aPromotablePackageJsonD("packages/peaches/package.json")]} | ${["packages/apples/LOG.md is not a supported filename and must be renamed to packages/apples/CHANGELOG.md in Updraft v2.0.0."]}                                                                            | ${[aPromotedMarkdownChangelogB("packages/apples/LOG.md", "9.1.0", "2017-12-27"), aPromotedMarkdownChangelogD("packages/oranges/CHANGELOG.md", "9.1.0", "2017-12-27"), aPromotedPackageJsonB("packages/oranges/package.json", "9.1.0"), aPromotedPackageJsonD("packages/peaches/package.json", "9.1.0")]}
`(
	"when at least one matching file is deprecated: $args",
	(props: {
		today: DateString
		args: string
		files: Files
		expectedWarnings: Array<string>
		expectedSavedFiles: Files
	}) => {
		let actualExitCode: ExitCode

		beforeEach(async () => {
			today.mockImplementation(() => props.today)
			readMatchingFiles.mockImplementation(async () => props.files)
			actualExitCode = await mainProgram(props.args.split(" "))
		})

		it("returns an exit code of 0", () => {
			expect(actualExitCode).toBe(0)
		})

		it(`displays ${props.expectedWarnings.length} warning(s)`, () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printError).not.toHaveBeenCalled()
			for (const [index, expectedWarning] of props.expectedWarnings.entries()) {
				expect(printWarning).toHaveBeenNthCalledWith(index + 1, expectedWarning)
			}
			expect(printWarning).toHaveBeenCalledTimes(props.expectedWarnings.length)
		})

		it("saves the promoted files including the deprecated ones", () => {
			expect(writeFiles).toHaveBeenCalledWith(props.expectedSavedFiles)
			expect(writeFiles).toHaveBeenCalledTimes(1)
		})
	},
)

describe.each`
	args                                                                                            | expectedError
	${"--files CHANGELOG.md package.json --release-version 4.3.0"}                                  | ${"Failed to read CHANGELOG.md: Permission denied"}
	${"--files packages/**/CHANGELOG.adoc packages/**/package.json --release-version 0.7.1-beta.1"} | ${"Failed to read packages/apples/package.json: File already in use"}
`(
	"when a file cannot be read: $args",
	(props: {
		args: string
		expectedError: string
	}) => {
		let actualExitCode: ExitCode

		beforeEach(async () => {
			readMatchingFiles.mockImplementation(async () => {
				throw new Error(props.expectedError)
			})
			actualExitCode = await mainProgram(props.args.split(" "))
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).toHaveBeenCalledWith(props.expectedError)
			expect(printError).toHaveBeenCalledTimes(1)
		})

		it("does not write changes to any file", () => {
			expect(writeFiles).not.toHaveBeenCalled()
		})
	},
)

describe.each`
	args                                                                                            | files                                                                                                                                                                                                                                                     | expectedError
	${"--files CHANGELOG.md package.json --release-version 4.3.0"}                                  | ${[aPromotableMarkdownChangelogA("CHANGELOG.md"), aPromotablePackageJsonA("package.json")]}                                                                                                                                                               | ${"Failed to write changes to CHANGELOG.md: Permission denied"}
	${"--files packages/**/CHANGELOG.adoc packages/**/package.json --release-version 0.7.1-beta.1"} | ${[aPromotableAsciidocChangelogA("packages/apples/CHANGELOG.adoc"), aPromotablePackageJsonB("packages/apples/package.json"), aPromotableAsciidocChangelogC("packages/oranges/CHANGELOG.adoc"), aPromotablePackageJsonD("packages/oranges/package.json")]} | ${"Failed to write changes to packages/apples/package.json: File already in use"}
`(
	"when changes to a file cannot be written: $args",
	(props: {
		args: string
		files: Files
		expectedError: string
	}) => {
		let actualExitCode: ExitCode

		beforeEach(async () => {
			readMatchingFiles.mockImplementation(async () => props.files)
			writeFiles.mockImplementation(async () => {
				throw new Error(props.expectedError)
			})
			actualExitCode = await mainProgram(props.args.split(" "))
		})

		it("returns an exit code of 1", () => {
			expect(actualExitCode).toBe(1)
		})

		it("displays an error", () => {
			expect(printMessage).not.toHaveBeenCalled()
			expect(printWarning).not.toHaveBeenCalled()
			expect(printError).toHaveBeenCalledWith(props.expectedError)
			expect(printError).toHaveBeenCalledTimes(1)
		})
	},
)
