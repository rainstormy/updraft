import { injectFileSystemMock } from "+adapters/FileSystem/FileSystem.mock"
import { injectLoggerMock } from "+adapters/Logger/Logger.mock"
import { injectTodayMock } from "+adapters/Today/Today.mock"
import { mainProgram } from "+program/Program"
import {
	getAsciidocChangelogDummies,
	getMarkdownChangelogDummies,
	getPackageJsonDummies,
	getUnsupportedDummies,
} from "+program/PromotionProgram/PromotionProgram.testdata"
import type { ExitCode } from "+utilities/ErrorUtilities"
import type { Release } from "+utilities/Release"
import type {
	DateString,
	SemanticVersionString,
} from "+utilities/StringUtilities"
import { beforeEach, describe, expect, it } from "vitest"

const { today } = injectTodayMock()
const { printMessage, printWarning, printError } = injectLoggerMock()
const { readMatchingFiles, writeFiles } = injectFileSystemMock()

describe.each`
	filePatterns                                            | releaseVersion                 | releaseDate
	${["package.json"]}                                     | ${"0.12.7"}                    | ${"2021-09-18"}
	${["CHANGELOG.md", "CHANGELOG.adoc"]}                   | ${"1.4.11"}                    | ${"2022-02-10"}
	${["RELEASES.adoc", "RELEASES.md", "package.json"]}     | ${"2.0.0-rc.2"}                | ${"2023-10-26"}
	${["packages/**/package.json", "**/*.adoc", "**/*.md"]} | ${"5.0.6-beta.2+6c7d48f9867c"} | ${"2024-06-12"}
`(
	"when the release version is $releaseVersion and the release date is $releaseDate",
	(releaseProps: {
		filePatterns: Array<string>
		releaseVersion: SemanticVersionString
		releaseDate: DateString
	}) => {
		const release: Release = {
			version: releaseProps.releaseVersion,
			date: releaseProps.releaseDate,
		}
		const {
			emptyFile: emptyAsciidocChangelog,
			nonPromotableFile: nonPromotableAsciidocChangelog,
			promotableFiles: promotableAsciidocChangelogs,
			expectedPromotedFiles: expectedPromotedAsciidocChangelogs,
		} = getAsciidocChangelogDummies(release)

		const {
			emptyFile: emptyMarkdownChangelog,
			nonPromotableFile: nonPromotableMarkdownChangelog,
			promotableFiles: promotableMarkdownChangelogs,
			expectedPromotedFiles: expectedPromotedMarkdownChangelogs,
		} = getMarkdownChangelogDummies(release)

		const {
			emptyFile: emptyPackageJsonFile,
			nonPromotableFile: nonPromotablePackageJsonFile,
			promotableFiles: promotablePackageJsonFiles,
			expectedPromotedFiles: expectedPromotedPackageJsonFiles,
		} = getPackageJsonDummies(release)

		const unsupportedFiles = getUnsupportedDummies()

		const args = [
			"--files",
			...releaseProps.filePatterns,
			"--release-version",
			release.version,
		]

		beforeEach(() => {
			today.mockImplementation(() => release.date)
		})

		let actualExitCode: ExitCode

		describe("and the file patterns do not match any files", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => []) // No matched files.
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 0", () => {
				expect(actualExitCode).toBe(0)
			})

			const filePatternList = releaseProps.filePatterns.join(", ")
			const expectedWarning = `${filePatternList} did not match any files.`

			it(`displays a warning that says '${expectedWarning}'`, () => {
				expect(printWarning).toHaveBeenCalledWith(expectedWarning)
				expect(printWarning).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the only matching AsciiDoc changelog file is empty", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					emptyAsciidocChangelog,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${emptyAsciidocChangelog.path} must have an 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("the only matching AsciiDoc changelog file cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					nonPromotableAsciidocChangelog,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotableAsciidocChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and one of three matching AsciiDoc changelog files cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[1],
					nonPromotableAsciidocChangelog,
					promotableAsciidocChangelogs[3],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotableAsciidocChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and one of three matching AsciiDoc changelog files is empty and another one cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[1],
					emptyAsciidocChangelog,
					nonPromotableAsciidocChangelog,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays two errors", () => {
				expect(printError).toHaveBeenNthCalledWith(
					1,
					`${emptyAsciidocChangelog.path} must have an 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenNthCalledWith(
					2,
					`${nonPromotableAsciidocChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(2)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the only matching AsciiDoc changelog file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[0],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 0", () => {
				expect(actualExitCode).toBe(0)
			})

			it("remains silent", () => {
				expect(printMessage).not.toHaveBeenCalled()
				expect(printWarning).not.toHaveBeenCalled()
				expect(printError).not.toHaveBeenCalled()
			})

			it("saves the promoted file", () => {
				expect(writeFiles).toHaveBeenCalledWith([
					expectedPromotedAsciidocChangelogs[0],
				])
				expect(writeFiles).toHaveBeenCalledTimes(1)
			})
		})

		describe("and all three matching AsciiDoc changelog files can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[1],
					promotableAsciidocChangelogs[2],
					promotableAsciidocChangelogs[3],
				])
				actualExitCode = await mainProgram(args)
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
				expect(writeFiles).toHaveBeenCalledWith([
					expectedPromotedAsciidocChangelogs[1],
					expectedPromotedAsciidocChangelogs[2],
					expectedPromotedAsciidocChangelogs[3],
				])
				expect(writeFiles).toHaveBeenCalledTimes(1)
			})
		})

		describe("and the only matching Markdown changelog file is empty", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					emptyMarkdownChangelog,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${emptyMarkdownChangelog.path} must have an 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the only matching Markdown changelog file cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					nonPromotableMarkdownChangelog,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotableMarkdownChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and one of three matching Markdown changelog files cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableMarkdownChangelogs[1],
					nonPromotableMarkdownChangelog,
					promotableMarkdownChangelogs[3],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotableMarkdownChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and one of three matching Markdown changelog files is empty and another one cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableMarkdownChangelogs[1],
					emptyMarkdownChangelog,
					nonPromotableMarkdownChangelog,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays two errors", () => {
				expect(printError).toHaveBeenNthCalledWith(
					1,
					`${emptyMarkdownChangelog.path} must have an 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenNthCalledWith(
					2,
					`${nonPromotableMarkdownChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(2)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the only matching Markdown changelog file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableMarkdownChangelogs[0],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 0", () => {
				expect(actualExitCode).toBe(0)
			})

			it("remains silent", () => {
				expect(printMessage).not.toHaveBeenCalled()
				expect(printWarning).not.toHaveBeenCalled()
				expect(printError).not.toHaveBeenCalled()
			})

			it("saves the promoted file", () => {
				expect(writeFiles).toHaveBeenCalledWith([
					expectedPromotedMarkdownChangelogs[0],
				])
				expect(writeFiles).toHaveBeenCalledTimes(1)
			})
		})

		describe("and all three matching Markdown changelog files can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableMarkdownChangelogs[1],
					promotableMarkdownChangelogs[2],
					promotableMarkdownChangelogs[3],
				])
				actualExitCode = await mainProgram(args)
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
				expect(writeFiles).toHaveBeenCalledWith([
					expectedPromotedMarkdownChangelogs[1],
					expectedPromotedMarkdownChangelogs[2],
					expectedPromotedMarkdownChangelogs[3],
				])
				expect(writeFiles).toHaveBeenCalledTimes(1)
			})
		})

		describe("and the only matching package.json file is empty", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [emptyPackageJsonFile])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${emptyPackageJsonFile.path} must have a 'version' field.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the only matching package.json file cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					nonPromotablePackageJsonFile,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotablePackageJsonFile.path} must have a 'version' field.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and one of three matching package.json files cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotablePackageJsonFiles[1],
					nonPromotablePackageJsonFile,
					promotablePackageJsonFiles[3],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotablePackageJsonFile.path} must have a 'version' field.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and one of three matching package.json files is empty and another one cannot be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotablePackageJsonFiles[1],
					emptyPackageJsonFile,
					nonPromotablePackageJsonFile,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays two errors", () => {
				expect(printError).toHaveBeenNthCalledWith(
					1,
					`${emptyPackageJsonFile.path} must have a 'version' field.`,
				)
				expect(printError).toHaveBeenNthCalledWith(
					2,
					`${nonPromotablePackageJsonFile.path} must have a 'version' field.`,
				)
				expect(printError).toHaveBeenCalledTimes(2)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the only matching package.json file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotablePackageJsonFiles[0],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 0", () => {
				expect(actualExitCode).toBe(0)
			})

			it("remains silent", () => {
				expect(printMessage).not.toHaveBeenCalled()
				expect(printWarning).not.toHaveBeenCalled()
				expect(printError).not.toHaveBeenCalled()
			})

			it("saves the promoted file", () => {
				expect(writeFiles).toHaveBeenCalledWith([
					expectedPromotedPackageJsonFiles[0],
				])
				expect(writeFiles).toHaveBeenCalledTimes(1)
			})
		})

		describe("and all three matching package.json files can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotablePackageJsonFiles[1],
					promotablePackageJsonFiles[2],
					promotablePackageJsonFiles[3],
				])
				actualExitCode = await mainProgram(args)
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
				expect(writeFiles).toHaveBeenCalledWith([
					expectedPromotedPackageJsonFiles[1],
					expectedPromotedPackageJsonFiles[2],
					expectedPromotedPackageJsonFiles[3],
				])
				expect(writeFiles).toHaveBeenCalledTimes(1)
			})
		})

		describe("and none of matching AsciiDoc changelog file, Markdown changelog file, and package.json file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					nonPromotableAsciidocChangelog,
					emptyMarkdownChangelog,
					nonPromotablePackageJsonFile,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays three errors", () => {
				expect(printError).toHaveBeenNthCalledWith(
					1,
					`${nonPromotableAsciidocChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenNthCalledWith(
					2,
					`${emptyMarkdownChangelog.path} must have an 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenNthCalledWith(
					3,
					`${nonPromotablePackageJsonFile.path} must have a 'version' field.`,
				)
				expect(printError).toHaveBeenCalledTimes(3)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the matching AsciiDoc changelog file cannot be promoted while the matching Markdown changelog file and package.json file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					nonPromotableAsciidocChangelog,
					promotableMarkdownChangelogs[0],
					promotablePackageJsonFiles[0],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotableAsciidocChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the matching Markdown changelog file cannot be promoted while the matching AsciiDoc changelog file and package.json file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[0],
					nonPromotableMarkdownChangelog,
					promotablePackageJsonFiles[0],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotableMarkdownChangelog.path} must have at least one item in the 'Unreleased' section.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and the matching package.json file cannot be promoted while the matching AsciiDoc changelog file and Markdown changelog file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[0],
					promotableMarkdownChangelogs[0],
					nonPromotablePackageJsonFile,
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${nonPromotablePackageJsonFile.path} must have a 'version' field.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and all of matching AsciiDoc changelog file, Markdown changelog file, and package.json file can be promoted", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[1],
					promotableMarkdownChangelogs[2],
					promotablePackageJsonFiles[3],
				])
				actualExitCode = await mainProgram(args)
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
				expect(writeFiles).toHaveBeenCalledWith([
					expectedPromotedAsciidocChangelogs[1],
					expectedPromotedMarkdownChangelogs[2],
					expectedPromotedPackageJsonFiles[3],
				])
				expect(writeFiles).toHaveBeenCalledTimes(1)
			})
		})

		describe("and the only matching file is unsupported", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [unsupportedFiles[0]])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${unsupportedFiles[0].path} is not a supported file format.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe("and one of four matching files is unsupported", () => {
			beforeEach(async () => {
				readMatchingFiles.mockImplementation(async () => [
					promotableAsciidocChangelogs[0],
					unsupportedFiles[1],
					promotableMarkdownChangelogs[2],
					promotablePackageJsonFiles[3],
				])
				actualExitCode = await mainProgram(args)
			})

			it("returns an exit code of 1", () => {
				expect(actualExitCode).toBe(1)
			})

			it("displays an error", () => {
				expect(printError).toHaveBeenCalledWith(
					`${unsupportedFiles[1].path} is not a supported file format.`,
				)
				expect(printError).toHaveBeenCalledTimes(1)
			})

			it("does not write changes to any file", () => {
				expect(writeFiles).not.toHaveBeenCalled()
			})
		})

		describe.each`
			filename                                | errorMessage
			${promotableAsciidocChangelogs[0].path} | ${"Permission denied"}
			${promotablePackageJsonFiles[0].path}   | ${"File already in use"}
		`(
			"and a file named $filename cannot be read due to $errorMessage",
			(errorProps: {
				filename: string
				errorMessage: string
			}) => {
				const fullErrorMessage = `Failed to read ${errorProps.filename}: ${errorProps.errorMessage}.`

				beforeEach(async () => {
					readMatchingFiles.mockImplementation(async () => {
						throw new Error(fullErrorMessage)
					})
					actualExitCode = await mainProgram(args)
				})

				it("returns an exit code of 1", () => {
					expect(actualExitCode).toBe(1)
				})

				it("displays an error", () => {
					expect(printError).toHaveBeenCalledWith(fullErrorMessage)
					expect(printError).toHaveBeenCalledTimes(1)
				})

				it("does not write changes to any file", () => {
					expect(writeFiles).not.toHaveBeenCalled()
				})
			},
		)

		describe.each`
			filename                                | errorMessage
			${promotablePackageJsonFiles[1].path}   | ${"Permission denied"}
			${promotableMarkdownChangelogs[1].path} | ${"File already in use"}
		`(
			"and changes to a file named $filename cannot be written due to $errorMessage",
			(errorProps: {
				filename: string
				errorMessage: string
			}) => {
				const fullErrorMessage = `Failed to write changes to ${errorProps.filename}: ${errorProps.errorMessage}.`

				beforeEach(async () => {
					readMatchingFiles.mockImplementation(async () => [
						promotableAsciidocChangelogs[1],
						promotableMarkdownChangelogs[1],
						promotablePackageJsonFiles[1],
					])
					writeFiles.mockImplementation(async () => {
						throw new Error(fullErrorMessage)
					})
					actualExitCode = await mainProgram(args)
				})

				it("returns an exit code of 1", () => {
					expect(actualExitCode).toBe(1)
				})

				it("displays an error", () => {
					expect(printError).toHaveBeenCalledWith(fullErrorMessage)
					expect(printError).toHaveBeenCalledTimes(1)
				})
			},
		)
	},
)
