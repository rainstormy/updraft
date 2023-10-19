import type { Changelog, PromoteChangelogResult } from "+changelogs"
import { promoteChangelog } from "+changelogs"
import { assumeNotNullish, dedent } from "+utilities"
import { describe, expect, it } from "vitest"

describe("when the changelog has no sections", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [],
	}

	describe("promoting the changelog", () => {
		const newRelease: Changelog.Release = {
			version: "0.12.7",
			date: "2023-05-04",
		}

		const result = promoteChangelog(changelog, newRelease)

		it("raises an error", () => {
			assumeFailed(result)
			expect(result.errorMessage).toBe(
				"The changelog must have an 'Unreleased' section",
			)
		})
	})
})

describe("when the changelog contains an empty unreleased section", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Releases

			You can find all releases in this document.
		`,
		sections: [
			{
				repositoryUrl: "https://github.com/rainstormy/release-automation",
				previousRelease: null,
				release: null,
				sectionBody: "",
			},
		],
	}

	describe("promoting the changelog", () => {
		const newRelease: Changelog.Release = {
			version: "2.1.6",
			date: "2022-07-01",
		}

		const result = promoteChangelog(changelog, newRelease)

		it("raises an error", () => {
			assumeFailed(result)
			expect(result.errorMessage).toBe(
				"The 'Unreleased' section in the changelog must contain at least one item",
			)
		})
	})
})

describe("when the changelog contains a non-empty unreleased section without a link to the GitHub repository", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [
			{
				repositoryUrl: null,
				previousRelease: null,
				release: null,
				sectionBody: dedent`
					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			},
		],
	}

	describe("promoting the changelog", () => {
		const newRelease: Changelog.Release = {
			version: "1.1.0",
			date: "2021-09-25",
		}

		const result = promoteChangelog(changelog, newRelease)

		it("raises an error", () => {
			assumeFailed(result)
			expect(result.errorMessage).toBe(
				"The 'Unreleased' section in the changelog must include a link to the GitHub repository",
			)
		})
	})
})

describe("when the changelog contains a non-empty unreleased section and no prior releases", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Releases

			You can find all releases in this document.
		`,
		sections: [
			{
				repositoryUrl: "https://github.com/rainstormy/release-automation",
				previousRelease: null,
				release: null,
				sectionBody: dedent`
					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			},
		],
	}

	describe("promoting the changelog", () => {
		const newRelease: Changelog.Release = {
			version: "0.12.7",
			date: "2023-05-04",
		}

		const result = promoteChangelog(changelog, newRelease)

		it("preserves the preamble", () => {
			assumeSucceeded(result)
			expect(result.promotedChangelog.preamble).toBe(changelog.preamble)
		})

		it("inserts a new section", () => {
			assumeSucceeded(result)
			expect(result.promotedChangelog.sections).toHaveLength(
				changelog.sections.length + 1,
			)
		})

		it("contains an empty unreleased section", () => {
			assumeSucceeded(result)
			const unreleasedSection = result.promotedChangelog.sections[0]

			assumeNotNullish(unreleasedSection)
			expect(unreleasedSection.release).toBeNull()
			expect(unreleasedSection.sectionBody).toBe("")
		})

		it("preserves the repository URL in the empty unreleased section", () => {
			assumeSucceeded(result)
			const unreleasedSection = result.promotedChangelog.sections[0]

			assumeNotNullish(unreleasedSection)
			expect(unreleasedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("makes the empty unreleased section refer back to the newly promoted release", () => {
			assumeSucceeded(result)
			const unreleasedSection = result.promotedChangelog.sections[0]

			assumeNotNullish(unreleasedSection)
			expect(unreleasedSection.previousRelease).toStrictEqual(newRelease)
		})

		it("promotes the existing unreleased section to become a new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.release).toStrictEqual(newRelease)
		})

		it("preserves the promoted items in the new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.sectionBody).toBe(
				changelog.sections[0].sectionBody,
			)
		})

		it("preserves the repository URL in the new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("preserves the reference to the previous release in the new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.previousRelease).toStrictEqual(
				changelog.sections[0].previousRelease,
			)
		})
	})
})

describe("when the changelog contains a non-empty unreleased section and two prior releases", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [
			{
				repositoryUrl: "{url-github}",
				previousRelease: {
					version: "10.1.7",
					date: "2023-03-04",
				},
				release: null,
				sectionBody: dedent`
					=== Added
					* A hot chocolate machine for the office.

					=== Changed
					* The fruit basket is now refilled every day.
				`,
			},
			{
				repositoryUrl: "{url-github}",
				previousRelease: {
					version: "10.0.0",
					date: "2022-12-22",
				},
				release: {
					version: "10.1.7",
					date: "2023-03-04",
				},
				sectionBody: dedent`
					=== Fixed
					* Milk in the refrigerator is now fresh.
				`,
			},
			{
				repositoryUrl: "{url-github}",
				previousRelease: null,
				release: {
					version: "10.0.0",
					date: "2022-12-22",
				},
				sectionBody: dedent`
					=== Added
					* A new cold water dispenser.
					* Skylights in the ceiling.
				`,
			},
		],
	}

	describe("promoting the changelog", () => {
		const newRelease: Changelog.Release = {
			version: "10.12.9-beta.6",
			date: "2024-03-27",
		}

		const result = promoteChangelog(changelog, newRelease)

		it("preserves the preamble", () => {
			assumeSucceeded(result)
			expect(result.promotedChangelog.preamble).toBe(changelog.preamble)
		})

		it("inserts a new section", () => {
			assumeSucceeded(result)
			expect(result.promotedChangelog.sections).toHaveLength(
				changelog.sections.length + 1,
			)
		})

		it("contains an empty unreleased section", () => {
			assumeSucceeded(result)
			const unreleasedSection = result.promotedChangelog.sections[0]

			assumeNotNullish(unreleasedSection)
			expect(unreleasedSection.release).toBeNull()
			expect(unreleasedSection.sectionBody).toBe("")
		})

		it("preserves the repository URL in the empty unreleased section", () => {
			assumeSucceeded(result)
			const unreleasedSection = result.promotedChangelog.sections[0]

			assumeNotNullish(unreleasedSection)
			expect(unreleasedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("makes the empty unreleased section refer back to the newly promoted release", () => {
			assumeSucceeded(result)
			const unreleasedSection = result.promotedChangelog.sections[0]

			assumeNotNullish(unreleasedSection)
			expect(unreleasedSection.previousRelease).toStrictEqual(newRelease)
		})

		it("promotes the existing unreleased section to become a new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.release).toStrictEqual(newRelease)
		})

		it("preserves the promoted items in the new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.sectionBody).toBe(
				changelog.sections[0].sectionBody,
			)
		})

		it("preserves the repository URL in the new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("preserves the reference to the previous release in the new release", () => {
			assumeSucceeded(result)
			const promotedSection = result.promotedChangelog.sections[1]

			assumeNotNullish(promotedSection)
			expect(promotedSection.previousRelease).toStrictEqual(
				changelog.sections[0].previousRelease,
			)
		})

		it("preserves the existing release sections", () => {
			assumeSucceeded(result)
			expect(result.promotedChangelog.sections[2]).toStrictEqual(
				changelog.sections[1],
			)
			expect(result.promotedChangelog.sections[3]).toStrictEqual(
				changelog.sections[2],
			)
		})
	})
})

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
