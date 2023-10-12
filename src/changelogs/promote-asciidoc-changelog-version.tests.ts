import { describe, expect, it } from "vitest"
import { dedent } from "+utilities"
import type {
	PromoteChangelogOptions,
	PromoteChangelogResult,
} from "./promote-asciidoc-changelog-version"
import { promoteAsciidocChangelogVersion } from "./promote-asciidoc-changelog-version"

const preamble = dedent`
	= Changelog
	:experimental:
	:source-highlighter: highlight.js

	This file documents all notable changes to this project.
	The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].
`

const sectionOfBathroomAppliances = dedent`
	=== Added
	* A new shower mode: \`jet-stream\`.
	* Soft toilet paper.
	* Ambient music.

	=== Fixed
	* Heating in toilet seats has been restored.
`

const sectionOfKitchenAppliances = dedent`
	=== Added
	* A hot chocolate machine for the office.
	* New coffee modes: \`espresso\` and \`cappuccino\`.

	=== Changed
	* The fruit basket is now refilled every day.

	=== Fixed
	* The coffee machine will no longer produce ice cubes.
	* Milk in the refrigerator is now fresh.
`

const sectionOfOfficeAppliances = dedent`
	=== Added
	* A new cold water dispenser.
	* Skylights in the ceiling.

	=== Fixed
	* Office chairs are now more comfortable.
	* Books on the shelf are now alphabetically sorted.

	=== Changed
	* The office is now open 24/7.

	=== Removed
	* Dust on the floor.
`

describe.each`
	versionToRelease    | releaseDate
	${"0.12.7"}         | ${"2023-05-04"}
	${"1.0.0"}          | ${"2023-10-11"}
	${"10.12.9-beta.6"} | ${"2024-03-27"}
`(
	"promoting version $versionToRelease released on $releaseDate in an AsciiDoc changelog",
	(options: PromoteChangelogOptions) => {
		describe("when the changelog is completely empty", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
				`,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errorMessage).toBe(
					"The 'Unreleased' section is missing in the changelog",
				)
			})
		})

		describe("when the changelog only contains a preamble and no other sections", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}
				`,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errorMessage).toBe(
					"The 'Unreleased' section is missing in the changelog",
				)
			})
		})

		describe("when the changelog contains an empty 'Unreleased' section without a link to the GitHub repository", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== Unreleased
					${sectionOfOfficeAppliances}
				`,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errorMessage).toBe(
					"The 'Unreleased' section in the changelog must include a link to the GitHub repository",
				)
			})
		})

		describe("when the changelog contains an empty 'Unreleased' section", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== https://github.com/rainstormy/github-action-prepare-release-to-npm[Unreleased]
				`,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errorMessage).toBe(
					"The 'Unreleased' section in the changelog must contain at least one item",
				)
			})
		})

		describe("when the changelog contains an earlier release section and an empty 'Unreleased' section", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== https://github.com/spdiswal/coolciv/compare/v0.5.1\\...HEAD[Unreleased]

					== https://github.com/spdiswal/coolciv/releases/tag/v0.5.1[0.5.1] - 2022-12-22
					${sectionOfOfficeAppliances}
				`,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errorMessage).toBe(
					"The 'Unreleased' section in the changelog must contain at least one item",
				)
			})
		})

		describe("when the changelog contains an empty 'Unreleased' section without a link to the GitHub repository", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== Unreleased
					${sectionOfBathroomAppliances}
				`,
			})

			it("raises an error", () => {
				assumeFailed(result)
				expect(result.errorMessage).toBe(
					"The 'Unreleased' section in the changelog must include a link to the GitHub repository",
				)
			})
		})

		describe("when the changelog contains a non-empty 'Unreleased' section with a complete link to the GitHub repository", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== https://github.com/rainstormy/github-action-prepare-release-to-npm[Unreleased]
					${sectionOfOfficeAppliances}
				`,
			})

			it(`promotes the existing 'Unreleased' section to become '${options.versionToRelease}' and inserts a new, empty 'Unreleased' section`, () => {
				assumeSucceeded(result)
				expect(result.content).toBe(dedent`
					${preamble}

					== https://github.com/rainstormy/github-action-prepare-release-to-npm/compare/v${options.versionToRelease}\\...HEAD[Unreleased]

					== https://github.com/rainstormy/github-action-prepare-release-to-npm/releases/tag/v${options.versionToRelease}[${options.versionToRelease}] - ${options.releaseDate}
					${sectionOfOfficeAppliances}
				`)
			})
		})

		describe("when the changelog contains a non-empty 'Unreleased' section with a partial link to the GitHub repository", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== {url-github}[Unreleased]
					${sectionOfKitchenAppliances}
				`,
			})

			it(`promotes the existing 'Unreleased' section to become '${options.versionToRelease}' and inserts a new, empty 'Unreleased' section`, () => {
				assumeSucceeded(result)
				expect(result.content).toBe(dedent`
					${preamble}

					== {url-github}/compare/v${options.versionToRelease}\\...HEAD[Unreleased]

					== {url-github}/releases/tag/v${options.versionToRelease}[${options.versionToRelease}] - ${options.releaseDate}
					${sectionOfKitchenAppliances}
				`)
			})
		})

		describe("when the changelog contains an earlier release section and a non-empty 'Unreleased' section", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== https://github.com/spdiswal/coolciv/compare/v0.5.1\\...HEAD[Unreleased]
					${sectionOfBathroomAppliances}

					== https://github.com/spdiswal/coolciv/releases/tag/v0.5.1[0.5.1] - 2022-12-22
					${sectionOfOfficeAppliances}
				`,
			})

			it(`promotes the existing 'Unreleased' section to become '${options.versionToRelease}' and inserts a new, empty 'Unreleased' section`, () => {
				assumeSucceeded(result)
				expect(result.content).toBe(dedent`
					${preamble}

					== https://github.com/spdiswal/coolciv/compare/v${options.versionToRelease}\\...HEAD[Unreleased]

					== https://github.com/spdiswal/coolciv/compare/v0.5.1\\...v${options.versionToRelease}[${options.versionToRelease}] - ${options.releaseDate}
					${sectionOfBathroomAppliances}

					== https://github.com/spdiswal/coolciv/releases/tag/v0.5.1[0.5.1] - 2022-12-22
					${sectionOfOfficeAppliances}
				`)
			})
		})

		describe("when the changelog contains two earlier release sections and a non-empty 'Unreleased' section", () => {
			const result = promoteAsciidocChangelogVersion({
				...options,
				originalContent: dedent`
					${preamble}

					== {url-owner-repo}/compare/v0.1.2\\...HEAD[Unreleased]
					${sectionOfKitchenAppliances}

					== {url-owner-repo}/compare/v0.0.1\\...v0.1.2[0.1.2] - 2021-10-31
					${sectionOfOfficeAppliances}

					== {url-owner-repo}/releases/tag/v0.0.1[0.0.1] - 2021-06-11
					${sectionOfBathroomAppliances}
				`,
			})

			it(`promotes the existing 'Unreleased' section to become '${options.versionToRelease}' and inserts a new, empty 'Unreleased' section`, () => {
				assumeSucceeded(result)
				expect(result.content).toBe(dedent`
					${preamble}

					== {url-owner-repo}/compare/v${options.versionToRelease}\\...HEAD[Unreleased]

					== {url-owner-repo}/compare/v0.1.2\\...v${options.versionToRelease}[${options.versionToRelease}] - ${options.releaseDate}
					${sectionOfKitchenAppliances}

					== {url-owner-repo}/compare/v0.0.1\\...v0.1.2[0.1.2] - 2021-10-31
					${sectionOfOfficeAppliances}

					== {url-owner-repo}/releases/tag/v0.0.1[0.0.1] - 2021-06-11
					${sectionOfBathroomAppliances}
				`)
			})
		})
	},
)

function assumeSucceeded(
	result: PromoteChangelogResult,
): asserts result is PromoteChangelogResult.Succeeded {
	if (result.status !== "succeeded") {
		expect.fail(`Expected a succeeded result, but it ${result.status}`)
	}
}

function assumeFailed(
	result: PromoteChangelogResult,
): asserts result is PromoteChangelogResult.Failed {
	if (result.status !== "failed") {
		expect.fail(`Expected a failed result, but it ${result.status}`)
	}
}
