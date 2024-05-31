import { promotePackage } from "+packages/PackagePromoter"
import type { Release } from "+utilities/Release"
import { type SemanticVersionString, dedent } from "+utilities/StringUtilities"
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

	const newRelease: Release = { version: "1.0.0", date: "2023-10-01" }
	const throwingAction = () => promotePackage(originalContent, newRelease)

	it("raises an error", async () => {
		await expect(throwingAction).rejects.toThrow("must have a 'version' field")
	})
})

describe.each`
	currentVersion    | versionToRelease
	${"1.0.0"}        | ${"1.0.1"}
	${"7.1.3-beta.7"} | ${"7.1.3"}
`(
	"when the package.json file has a 'version' field of $currentVersion",
	async (props: {
		currentVersion: SemanticVersionString
		versionToRelease: SemanticVersionString
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
				"version": "${props.versionToRelease}",
				"type": "module",
				"main": "dist/prettier.config.js",
				"types": "dist/prettier.config.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@3.6.3"
			}
		`}\n`

		const newRelease: Release = {
			version: props.versionToRelease,
			date: "2023-10-01",
		}
		const actualPromotedContent = await promotePackage(
			originalContent,
			newRelease,
		)

		it(`updates the 'version' field to ${props.versionToRelease}`, () => {
			expect(actualPromotedContent).toBe(expectedPromotedContent)
		})
	},
)
