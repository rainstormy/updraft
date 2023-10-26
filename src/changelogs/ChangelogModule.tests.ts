import type {
	DateString,
	PathsWithContent,
	SemanticVersionString,
} from "+utilities"
import { dedent } from "+utilities"
import { describe, expect, it } from "vitest"
import type { PromoteChangelogs } from "./ChangelogModule"
import { promoteChangelogs } from "./ChangelogModule"

describe("when there are no input files", () => {
	const pathsWithContent: PathsWithContent = []

	describe("promoting the changelog", async () => {
		const result = await promoteChangelogs({
			pathsWithContent,
			newRelease: { version: "1.2.3", date: "2022-01-01" },
		})

		it("outputs nothing", () => {
			assumeSucceeded(result)
			expect(result.outputPathsWithContent).toStrictEqual([])
		})
	})
})

describe.each`
	inputFilePath          | newReleaseVersion | newReleaseDate
	${"CHANGELOG.adoc"}    | ${"1.4.11"}       | ${"2023-10-26"}
	${"lib/RELEASES.adoc"} | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when there is one input file $inputFilePath with a promotable changelog",
	(input: {
		readonly inputFilePath: string
		readonly newReleaseVersion: SemanticVersionString
		readonly newReleaseDate: DateString
	}) => {
		const { inputFilePath, newReleaseVersion, newReleaseDate } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePath,
				dedent`
					= Changelog


					== {url-repo}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.
				`,
			],
		]

		describe(`promoting the changelog to ${newReleaseVersion} on ${newReleaseDate}`, async () => {
			const result = await promoteChangelogs({
				pathsWithContent,
				newRelease: { version: newReleaseVersion, date: newReleaseDate },
			})

			it("outputs the promoted changelog", () => {
				assumeSucceeded(result)
				expect(result.outputPathsWithContent).toStrictEqual([
					[
						inputFilePath,
						dedent`
							= Changelog


							== {url-repo}/compare/v${newReleaseVersion}\\...HEAD[Unreleased]


							== {url-repo}/releases/tag/v${newReleaseVersion}[${newReleaseVersion}] - ${newReleaseDate}

							=== Changed
							* The fruit basket is now refilled every day.
						`,
					],
				])
			})
		})
	},
)

describe.each`
	inputFilePath          | newReleaseVersion | newReleaseDate
	${"CHANGELOG.adoc"}    | ${"1.4.11"}       | ${"2023-10-26"}
	${"lib/RELEASES.adoc"} | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when there is one empty input file $inputFilePath",
	(input: {
		readonly inputFilePath: string
		readonly newReleaseVersion: SemanticVersionString
		readonly newReleaseDate: DateString
	}) => {
		const { inputFilePath, newReleaseVersion, newReleaseDate } = input

		const pathsWithContent: PathsWithContent = [[inputFilePath, ""]]

		describe(`promoting the changelog to ${newReleaseVersion} on ${newReleaseDate}`, async () => {
			const result = await promoteChangelogs({
				pathsWithContent,
				newRelease: { version: newReleaseVersion, date: newReleaseDate },
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errors).toStrictEqual([
					`${inputFilePath} must have an 'Unreleased' section`,
				])
			})
		})
	},
)

describe.each`
	inputFilePath          | newReleaseVersion | newReleaseDate
	${"CHANGELOG.adoc"}    | ${"1.4.11"}       | ${"2023-10-26"}
	${"lib/RELEASES.adoc"} | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when there is one input file $inputFilePath with a non-promotable changelog",
	(input: {
		readonly inputFilePath: string
		readonly newReleaseVersion: SemanticVersionString
		readonly newReleaseDate: DateString
	}) => {
		const { inputFilePath, newReleaseVersion, newReleaseDate } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePath,
				dedent`
					= Changelog

					== {url-repo}[Unreleased]
				`,
			],
		]

		describe(`promoting the changelog to ${newReleaseVersion} on ${newReleaseDate}`, async () => {
			const result = await promoteChangelogs({
				pathsWithContent,
				newRelease: { version: newReleaseVersion, date: newReleaseDate },
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errors).toStrictEqual([
					`${inputFilePath} must have at least one item in the 'Unreleased' section`,
				])
			})
		})
	},
)

describe.each`
	inputFilePaths                                                                                           | newReleaseVersion | newReleaseDate
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${"1.4.11"}       | ${"2023-10-26"}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when there are three input files $inputFilePaths with promotable changelogs",
	(input: {
		readonly inputFilePaths: ReadonlyArray<string>
		readonly newReleaseVersion: SemanticVersionString
		readonly newReleaseDate: DateString
	}) => {
		const { inputFilePaths, newReleaseVersion, newReleaseDate } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePaths[0],
				dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[
				inputFilePaths[1],
				dedent`
					= Releases


					== {url-github}[Unreleased]

					=== Fixed
					* Office chairs are now more comfortable.
					* Books on the shelf are now alphabetically sorted.

					=== Changed
					* The office is now open 24/7.


					== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

					=== Added
					* A new cold water dispenser.
					* Skylights in the ceiling.
				`,
			],
			[
				inputFilePaths[2],
				dedent`
					= Changes


					== {url-github}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.

					=== Fixed
					* Milk in the refrigerator is now fresh.
				`,
			],
		]

		describe(`promoting the changelogs to ${newReleaseVersion} on ${newReleaseDate}`, async () => {
			const result = await promoteChangelogs({
				pathsWithContent,
				newRelease: { version: newReleaseVersion, date: newReleaseDate },
			})

			it("outputs the promoted changelogs", () => {
				assumeSucceeded(result)
				expect(result.outputPathsWithContent).toStrictEqual([
					[
						inputFilePaths[0],
						dedent`
							= Changelog


							== {url-github}/compare/v${newReleaseVersion}\\...HEAD[Unreleased]


							== {url-github}/releases/tag/v${newReleaseVersion}[${newReleaseVersion}] - ${newReleaseDate}

							=== Added
							* A new shower mode: \`jet-stream\`.
						`,
					],
					[
						inputFilePaths[1],
						dedent`
							= Releases


							== {url-github}/compare/v${newReleaseVersion}\\...HEAD[Unreleased]


							== {url-github}/compare/v0.9.9\\...v${newReleaseVersion}[${newReleaseVersion}] - ${newReleaseDate}

							=== Fixed
							* Office chairs are now more comfortable.
							* Books on the shelf are now alphabetically sorted.

							=== Changed
							* The office is now open 24/7.


							== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

							=== Added
							* A new cold water dispenser.
							* Skylights in the ceiling.
						`,
					],
					[
						inputFilePaths[2],
						dedent`
							= Changes


							== {url-github}/compare/v${newReleaseVersion}\\...HEAD[Unreleased]


							== {url-github}/releases/tag/v${newReleaseVersion}[${newReleaseVersion}] - ${newReleaseDate}

							=== Changed
							* The fruit basket is now refilled every day.

							=== Fixed
							* Milk in the refrigerator is now fresh.
						`,
					],
				])
			})
		})
	},
)

describe.each`
	inputFilePaths                                                                                           | newReleaseVersion | newReleaseDate
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${"1.4.11"}       | ${"2023-10-26"}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when there are three input files $inputFilePaths including one with a non-promotable changelog",
	(input: {
		readonly inputFilePaths: ReadonlyArray<string>
		readonly newReleaseVersion: SemanticVersionString
		readonly newReleaseDate: DateString
	}) => {
		const { inputFilePaths, newReleaseVersion, newReleaseDate } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePaths[0],
				dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[
				inputFilePaths[1],
				dedent`
					= Releases


					== {url-github}[Unreleased]


					== {url-github}/releases/tag/v0.9.9[0.9.9] - 2023-04-09

					=== Added
					* A new cold water dispenser.
					* Skylights in the ceiling.
				`,
			],
			[
				inputFilePaths[2],
				dedent`
					= Changes


					== {url-github}[Unreleased]

					=== Changed
					* The fruit basket is now refilled every day.

					=== Fixed
					* Milk in the refrigerator is now fresh.
				`,
			],
		]

		describe(`promoting the changelogs to ${newReleaseVersion} on ${newReleaseDate}`, async () => {
			const result = await promoteChangelogs({
				pathsWithContent,
				newRelease: { version: newReleaseVersion, date: newReleaseDate },
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errors).toStrictEqual([
					`${inputFilePaths[1]} must have at least one item in the 'Unreleased' section`,
				])
			})
		})
	},
)

describe.each`
	inputFilePaths                                                                                           | newReleaseVersion | newReleaseDate
	${["packages/apples/CHANGELOG.adoc", "packages/oranges/RELEASES.adoc", "packages/peaches/CHANGES.adoc"]} | ${"1.4.11"}       | ${"2023-10-26"}
	${["lib/CHANGELOG.adoc", "dist/CHANGELOG.adoc", "docs/CHANGELOG.adoc"]}                                  | ${"5.0.6-beta.2"} | ${"2024-06-12"}
`(
	"when there are three input files $inputFilePaths including an empty one and one with a non-promotable changelog",
	(input: {
		readonly inputFilePaths: ReadonlyArray<string>
		readonly newReleaseVersion: SemanticVersionString
		readonly newReleaseDate: DateString
	}) => {
		const { inputFilePaths, newReleaseVersion, newReleaseDate } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePaths[0],
				dedent`
					= Changelog


					== {url-github}[Unreleased]

					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			],
			[inputFilePaths[1], ""],
			[
				inputFilePaths[2],
				dedent`
					= Changes


					== {url-github}[Unreleased]
				`,
			],
		]

		describe(`promoting the changelogs to ${newReleaseVersion} on ${newReleaseDate}`, async () => {
			const result = await promoteChangelogs({
				pathsWithContent,
				newRelease: { version: newReleaseVersion, date: newReleaseDate },
			})

			it("raises two errors", () => {
				assumeFailed(result)
				expect(result.errors).toStrictEqual([
					`${inputFilePaths[1]} must have an 'Unreleased' section`,
					`${inputFilePaths[2]} must have at least one item in the 'Unreleased' section`,
				])
			})
		})
	},
)

function assumeFailed(
	result: PromoteChangelogs.Result,
): asserts result is PromoteChangelogs.Failed {
	expect(result.status).toBe("failed")
}

function assumeSucceeded(
	result: PromoteChangelogs.Result,
): asserts result is PromoteChangelogs.Succeeded {
	expect(result.status).toBe("succeeded")
}
