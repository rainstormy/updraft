import { promotePackageJson } from "+promoters/PromotePackageJson/PromotePackageJson"
import { dedent } from "+utilities/StringUtilities"
import type { Release } from "+utilities/types/Release"
import type { SemanticVersionString } from "+utilities/types/SemanticVersionString"
import { describe, expect, it } from "vitest"

describe("when the package.json file does not have a 'version' field", () => {
	const originalContent = dedent`
		{
			"$schema": "https://json.schemastore.org/package.json",
			"private": true,
			"type": "module",
			"packageManager": "yarn@3.6.3"
		}
	`
	const newRelease: Release = {
		checks: [],
		date: "2023-10-01",
		version: "1.0.0",
	}
	const throwingAction = () => promotePackageJson(originalContent, newRelease)

	it("raises an error", async () => {
		await expect(throwingAction).rejects.toThrow("must have a 'version' field")
	})
})

describe.each`
	currentVersion           | nextVersion
	${"1.0.0"}               | ${"1.0.1"}
	${"7.1.3-beta.7"}        | ${"7.1.3"}
	${"9.0.5-rc.0+3a1c790f"} | ${"9.0.5"}
`(
	"when the package.json file has a 'version' field of $currentVersion",
	async (props: {
		currentVersion: SemanticVersionString
		nextVersion: SemanticVersionString
	}) => {
		const originalContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/preset-prettier-base",
				"version": "${props.currentVersion}",
				"type": "module",
				"main": "dist/prettier.config.js",
				"types": "dist/prettier.config.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@3.6.3"
			}
		`
		const expectedPromotedContent = `${dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/preset-prettier-base",
				"version": "${props.nextVersion}",
				"type": "module",
				"main": "dist/prettier.config.js",
				"types": "dist/prettier.config.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@3.6.3"
			}
		`}\n`

		const newRelease: Release = {
			checks: [],
			date: "2023-10-01",
			version: props.nextVersion,
		}
		const actualPromotedContent = await promotePackageJson(
			originalContent,
			newRelease,
		)

		it(`updates the 'version' field to ${props.nextVersion}`, () => {
			expect(actualPromotedContent).toBe(expectedPromotedContent)
		})
	},
)

describe.each`
	currentVersion           | nextVersion
	${"2.0.0"}               | ${"2.1.0"}
	${"5.7.1-rc.0+93f9b843"} | ${"5.7.1-rc.0"}
`(
	"when the package.json file has a 'version' field of $currentVersion preceded by extra whitespace",
	async (props: {
		currentVersion: SemanticVersionString
		nextVersion: SemanticVersionString
	}) => {
		const originalContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/helix",
				"version":     "${props.currentVersion}",
				"type": "module",
			}
		`
		const expectedPromotedContent = `${dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/helix",
				"version":     "${props.nextVersion}",
				"type": "module",
			}
		`}\n`

		const newRelease: Release = {
			checks: [],
			date: "2024-04-15",
			version: props.nextVersion,
		}
		const actualPromotedContent = await promotePackageJson(
			originalContent,
			newRelease,
		)

		it(`updates the 'version' field to ${props.nextVersion} and preserves the preceding whitespace`, () => {
			expect(actualPromotedContent).toBe(expectedPromotedContent)
		})
	},
)

describe.each`
	currentVersion           | nextVersion
	${"1.0.0"}               | ${"1.1.1"}
	${"7.1.3-beta.7"}        | ${"7.1.3-beta.4"}
	${"9.0.5-rc.0+3a1c790f"} | ${"9.0.4"}
`(
	"when the package.json file is set to update to a non-sequential release of $nextVersion from $currentVersion",
	async (props: {
		currentVersion: SemanticVersionString
		nextVersion: SemanticVersionString
	}) => {
		const originalContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@spdiswal/coolciv",
				"version": "${props.currentVersion}",
				"type": "module",
				"packageManager": "pnpm@9.1.0+sha256.22e36fba7f4880ecf749a5ca128b8435da085ecd49575e7fb9e64d6bf4fad394"
			}
		`
		const newRelease: Release = {
			checks: ["sequential"],
			date: "2023-10-01",
			version: props.nextVersion,
		}
		const throwingAction = () => promotePackageJson(originalContent, newRelease)

		it("raises an error", async () => {
			await expect(throwingAction).rejects.toThrow(
				`has latest release version ${props.currentVersion}, but was set to update to ${props.nextVersion}`,
			)
		})
	},
)

describe.each`
	currentVersion
	${"1.0.0"}
	${"7.1.3-beta.7"}
	${"9.0.5-rc.0+3a1c790f"}
`(
	"when the package.json file is set to update to an existing release of $currentVersion",
	async (props: {
		currentVersion: SemanticVersionString
	}) => {
		const originalContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@spdiswal/coolciv",
				"version": "${props.currentVersion}",
				"type": "module",
				"packageManager": "pnpm@9.1.0+sha256.22e36fba7f4880ecf749a5ca128b8435da085ecd49575e7fb9e64d6bf4fad394"
			}
		`
		const newRelease: Release = {
			checks: ["sequential"],
			date: "2023-10-01",
			version: props.currentVersion,
		}
		const throwingAction = () => promotePackageJson(originalContent, newRelease)

		it("raises an error", async () => {
			await expect(throwingAction).rejects.toThrow(
				`already contains release version ${props.currentVersion}`,
			)
		})
	},
)
