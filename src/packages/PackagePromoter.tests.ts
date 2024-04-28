import { promotePackage } from "+packages/PackagePromoter"
import { type SemanticVersionString, dedent } from "+utilities/StringUtilities"
import { describe, expect, it } from "vitest"

describe("when the 'package.json' file does not have a 'version' field", () => {
	const originalPackageContent = dedent`
		{
			"$schema": "https://json.schemastore.org/package.json",
			"private": true,
			"type": "module",
			"packageManager": "yarn@3.6.3"
		}
	`

	describe("promoting the package", () => {
		const throwingAction = () =>
			promotePackage({
				originalPackageContent,
				newRelease: { version: "1.0.0", date: "2023-10-01" },
			})

		it("raises an error", async () => {
			await expect(throwingAction).rejects.toThrow(
				"must have a 'version' field",
			)
		})
	})
})

describe.each`
	currentVersion    | versionToRelease
	${"1.0.0"}        | ${"1.0.1"}
	${"7.1.3-beta.7"} | ${"7.1.3"}
`(
	"when the 'package.json' file has a 'version' field of $currentVersion",
	(releaseInput: {
		currentVersion: SemanticVersionString
		versionToRelease: SemanticVersionString
	}) => {
		const { currentVersion, versionToRelease } = releaseInput

		const originalPackageContent = dedent`
			{
				"$schema": "https://json.schemastore.org/package.json",
				"name": "@rainstormy/preset-prettier-base",
				"version": "${currentVersion}",
				"type": "module",
				"main": "dist/prettier.config.js",
				"types": "dist/prettier.config.d.ts",
				"files": ["dist"],
				"packageManager": "yarn@3.6.3"
			}
		`

		describe(`promoting the package to version ${versionToRelease}`, async () => {
			const promotedPackageContent = await promotePackage({
				originalPackageContent,
				newRelease: { version: versionToRelease, date: "2023-10-01" },
			})

			it(`updates the 'version' field to ${versionToRelease}`, () => {
				expect(promotedPackageContent).toBe(dedent`
					{
						"$schema": "https://json.schemastore.org/package.json",
						"name": "@rainstormy/preset-prettier-base",
						"version": "${versionToRelease}",
						"type": "module",
						"main": "dist/prettier.config.js",
						"types": "dist/prettier.config.d.ts",
						"files": ["dist"],
						"packageManager": "yarn@3.6.3"
					}
				`)
			})
		})
	},
)
