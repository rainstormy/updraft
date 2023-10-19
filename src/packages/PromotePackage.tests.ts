import type { PromotePackageResult } from "+packages"
import { promotePackage } from "+packages"
import type { SemanticVersionString } from "+utilities"
import { describe, expect, it } from "vitest"

describe("when the 'package.json' file does not have a 'version' field", () => {
	const packageJson = {
		$schema: "https://json.schemastore.org/package.json",
		private: true,
		type: "module",
		packageManager: "yarn@3.6.3",
	} as const

	describe("promoting the package", () => {
		const result = promotePackage(packageJson, "1.0.0")

		it("raises an error", () => {
			assumeFailed(result)
			expect(result.errorMessage).toBe(
				"The package.json file must have a 'version' field",
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
	(testRow: {
		readonly currentVersion: SemanticVersionString
		readonly versionToRelease: SemanticVersionString
	}) => {
		const { currentVersion, versionToRelease } = testRow

		const packageJson = {
			$schema: "https://json.schemastore.org/package.json",
			name: "@rainstormy/preset-prettier-base",
			version: currentVersion,
			type: "module",
			main: "dist/prettier.config.js",
			types: "dist/prettier.config.d.ts",
			files: ["dist"],
			packageManager: "yarn@3.6.3",
		} as const

		describe(`promoting the package to version ${versionToRelease}`, () => {
			const result = promotePackage(packageJson, versionToRelease)

			it(`updates the 'version' field to ${versionToRelease}`, () => {
				assumeSucceeded(result)
				expect(result.promotedPackageJson.version).toBe(versionToRelease)
			})

			it("preserves the property order in the 'package.json' file", () => {
				assumeSucceeded(result)
				expect(Object.keys(result.promotedPackageJson)).toStrictEqual(
					Object.keys(packageJson),
				)
			})
		})
	},
)

function assumeSucceeded(
	result: PromotePackageResult,
): asserts result is PromotePackageResult.Succeeded {
	if (result.status !== "succeeded") {
		expect.fail(`Expected a succeeded result, but it ${result.status}`)
	}
}

function assumeFailed(
	result: PromotePackageResult,
): asserts result is PromotePackageResult.Failed {
	if (result.status !== "failed") {
		expect.fail(`Expected a failed result, but it ${result.status}`)
	}
}
