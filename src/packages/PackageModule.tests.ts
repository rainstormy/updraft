import type { PromotePackages } from "+packages"
import { promotePackages } from "+packages"
import type { PathsWithContent, SemanticVersionString } from "+utilities"
import { dedent } from "+utilities"
import { describe, expect, it } from "vitest"

describe("when there are no input files", () => {
	const pathsWithContent: PathsWithContent = []

	describe("promoting the package", async () => {
		const result = await promotePackages({
			pathsWithContent,
			newReleaseVersion: "1.2.3",
		})

		it("outputs nothing", () => {
			assumeSucceeded(result)
			expect(result.outputPathsWithContent).toStrictEqual([])
		})
	})
})

describe.each`
	inputFilePath         | newReleaseVersion
	${"package.json"}     | ${"1.4.11"}
	${"lib/package.json"} | ${"5.0.6-beta.2"}
`(
	"when there is one input file $inputFilePath with a version field",
	(input: {
		readonly inputFilePath: string
		readonly newReleaseVersion: SemanticVersionString
	}) => {
		const { inputFilePath, newReleaseVersion } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePath,
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/preset-prettier-base",
						"version": "0.8.6",
						"type": "module",
						"main": "dist/prettier.config.js",
						"types": "dist/prettier.config.d.ts",
						"files": ["dist"],
						"packageManager": "yarn@3.6.3"
					}
				`,
			],
		]

		describe(`promoting the package to ${newReleaseVersion}`, async () => {
			const result = await promotePackages({
				pathsWithContent,
				newReleaseVersion,
			})

			it("outputs the promoted package", () => {
				assumeSucceeded(result)
				expect(result.outputPathsWithContent).toStrictEqual([
					[
						inputFilePath,
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/preset-prettier-base",
								"version": "${newReleaseVersion}",
								"type": "module",
								"main": "dist/prettier.config.js",
								"types": "dist/prettier.config.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@3.6.3"
							}
						`,
					],
				])
			})
		})
	},
)

describe.each`
	inputFilePath         | newReleaseVersion
	${"package.json"}     | ${"1.4.11"}
	${"lib/package.json"} | ${"5.0.6-beta.2"}
`(
	"when there is one input file $inputFilePath without a version field",
	(input: {
		readonly inputFilePath: string
		readonly newReleaseVersion: SemanticVersionString
	}) => {
		const { inputFilePath, newReleaseVersion } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePath,
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"private": true,
						"type": "module",
						"packageManager": "yarn@3.6.3"
					}
				`,
			],
		]

		describe(`promoting the package to ${newReleaseVersion}`, async () => {
			const result = await promotePackages({
				pathsWithContent,
				newReleaseVersion,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errors).toStrictEqual([
					`${inputFilePath} must have a 'version' field`,
				])
			})
		})
	},
)

describe.each`
	inputFilePaths                                                                                        | newReleaseVersion
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${"1.4.11"}
	${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${"5.0.6-beta.2"}
`(
	"when there are three input files $inputFilePaths with version fields",
	(input: {
		readonly inputFilePaths: ReadonlyArray<string>
		readonly newReleaseVersion: SemanticVersionString
	}) => {
		const { inputFilePaths, newReleaseVersion } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePaths[0],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/apples",
						"version": "1.0.12",
						"type": "module",
						"main": "dist/apples.js",
						"types": "dist/apples.d.ts",
						"files": ["dist"],
						"packageManager": "yarn@4.0.1"
					}
				`,
			],
			[
				inputFilePaths[1],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/oranges",
						"version": "1.0.12",
						"type": "module",
						"main": "dist/oranges.js",
						"types": "dist/oranges.d.ts",
						"files": ["dist"],
						"packageManager": "yarn@4.0.1"
					}
				`,
			],
			[
				inputFilePaths[2],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/peaches",
						"version": "1.0.12",
						"type": "module",
						"main": "dist/peaches.js",
						"types": "dist/peaches.d.ts",
						"files": ["dist"],
						"packageManager": "yarn@4.0.1"
					}
				`,
			],
		]

		describe(`promoting the packages to ${newReleaseVersion}`, async () => {
			const result = await promotePackages({
				pathsWithContent,
				newReleaseVersion,
			})

			it("outputs the promoted packages", () => {
				assumeSucceeded(result)
				expect(result.outputPathsWithContent).toStrictEqual([
					[
						inputFilePaths[0],
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/apples",
								"version": "${newReleaseVersion}",
								"type": "module",
								"main": "dist/apples.js",
								"types": "dist/apples.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@4.0.1"
							}
						`,
					],
					[
						inputFilePaths[1],
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/oranges",
								"version": "${newReleaseVersion}",
								"type": "module",
								"main": "dist/oranges.js",
								"types": "dist/oranges.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@4.0.1"
							}
						`,
					],
					[
						inputFilePaths[2],
						dedent`
							{
								"$schema": "https://json.schemastore.org/package.json",
								"name": "@rainstormy/peaches",
								"version": "${newReleaseVersion}",
								"type": "module",
								"main": "dist/peaches.js",
								"types": "dist/peaches.d.ts",
								"files": ["dist"],
								"packageManager": "yarn@4.0.1"
							}
						`,
					],
				])
			})
		})
	},
)

describe.each`
	inputFilePaths                                                                                        | newReleaseVersion
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${"1.4.11"}
	${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${"5.0.6-beta.2"}
`(
	"when there are three input files $inputFilePaths including one without a version field",
	(input: {
		readonly inputFilePaths: ReadonlyArray<string>
		readonly newReleaseVersion: SemanticVersionString
	}) => {
		const { inputFilePaths, newReleaseVersion } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePaths[0],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/apples",
						"version": "0.9.1",
					}
				`,
			],
			[
				inputFilePaths[1],
				dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/oranges",
						"version": "0.9.1",
					}
				`,
			],
			[
				inputFilePaths[2],
				dedent`
					{
						"private": true,
						"type": "module",
						"packageManager": "yarn@3.6.3"
					}
				`,
			],
		]

		describe(`promoting the packages to ${newReleaseVersion}`, async () => {
			const result = await promotePackages({
				pathsWithContent,
				newReleaseVersion,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errors).toStrictEqual([
					`${inputFilePaths[2]} must have a 'version' field`,
				])
			})
		})
	},
)

describe.each`
	inputFilePaths                                                                                        | newReleaseVersion
	${["packages/apples/package.json", "packages/oranges/package.json", "packages/peaches/package.json"]} | ${"1.4.11"}
	${["lib/package.json", "dist/package.json", "build/package.json"]}                                    | ${"5.0.6-beta.2"}
`(
	"when there are three input files $inputFilePaths including an empty one and one without a version field",
	(input: {
		readonly inputFilePaths: ReadonlyArray<string>
		readonly newReleaseVersion: SemanticVersionString
	}) => {
		const { inputFilePaths, newReleaseVersion } = input

		const pathsWithContent: PathsWithContent = [
			[
				inputFilePaths[0],
				dedent`
					{
						"private": true
					}
				`,
			],
			[inputFilePaths[1], ""],
			[
				inputFilePaths[2],
				dedent`
					{
						"name": "@rainstormy/peaches",
						"version": "0.5.0",
					}
				`,
			],
		]

		describe(`promoting the packages to ${newReleaseVersion}`, async () => {
			const result = await promotePackages({
				pathsWithContent,
				newReleaseVersion,
			})

			it("raises two errors", () => {
				assumeFailed(result)
				expect(result.errors).toStrictEqual([
					`${inputFilePaths[0]} must have a 'version' field`,
					`${inputFilePaths[1]} must have a 'version' field`,
				])
			})
		})
	},
)

function assumeFailed(
	result: PromotePackages.Result,
): asserts result is PromotePackages.Failed {
	expect(result.status).toBe("failed")
}

function assumeSucceeded(
	result: PromotePackages.Result,
): asserts result is PromotePackages.Succeeded {
	expect(result.status).toBe("succeeded")
}
