import { type Changelog } from "+changelogs/Changelog"
import { type Release } from "+utilities/Release"
import { dedent } from "+utilities/StringUtilities"
import { describe, expect, it } from "vitest"
import { promoteChangelog } from "./ChangelogPromoter"

describe("when the changelog has no sections", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [],
	}

	describe("promoting the changelog", () => {
		const throwingAction = () =>
			promoteChangelog({
				originalChangelog: changelog,
				newRelease: { version: "0.12.7", date: "2023-05-04" },
			})

		it("raises an error", async () => {
			await expect(throwingAction).rejects.toThrow(
				"must have an 'Unreleased' section",
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
				repositoryUrl: "https://github.com/rainstormy/updraft",
				previousRelease: null,
				release: null,
				sectionBody: "",
			},
		],
	}

	describe("promoting the changelog", () => {
		const throwingAction = () =>
			promoteChangelog({
				originalChangelog: changelog,
				newRelease: { version: "2.1.6", date: "2022-07-01" },
			})

		it("raises an error", async () => {
			await expect(throwingAction).rejects.toThrow(
				"must have at least one item in the 'Unreleased' section",
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
		const throwingAction = () =>
			promoteChangelog({
				originalChangelog: changelog,
				newRelease: { version: "1.1.0", date: "2021-09-25" },
			})

		it("raises an error", async () => {
			await expect(throwingAction).rejects.toThrow(
				"must have a link to the GitHub repository in the 'Unreleased' section",
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
				repositoryUrl: "https://github.com/rainstormy/updraft",
				previousRelease: null,
				release: null,
				sectionBody: dedent`
					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			},
		],
	}

	describe("promoting the changelog", async () => {
		const newRelease: Release = {
			version: "0.12.7",
			date: "2023-05-04",
		}
		const promotedChangelog = await promoteChangelog({
			originalChangelog: changelog,
			newRelease,
		})

		it("preserves the preamble", () => {
			expect(promotedChangelog.preamble).toBe(changelog.preamble)
		})

		it("inserts a new section", () => {
			expect(promotedChangelog.sections).toHaveLength(
				changelog.sections.length + 1,
			)
		})

		it("contains an empty unreleased section", () => {
			const unreleasedSection = promotedChangelog.sections[0]
			expect(unreleasedSection.release).toBeNull()
			expect(unreleasedSection.sectionBody).toBe("")
		})

		it("preserves the repository URL in the empty unreleased section", () => {
			const unreleasedSection = promotedChangelog.sections[0]
			expect(unreleasedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("makes the empty unreleased section refer back to the newly promoted release", () => {
			const unreleasedSection = promotedChangelog.sections[0]
			expect(unreleasedSection.previousRelease).toStrictEqual(newRelease)
		})

		it("promotes the existing unreleased section to become a new release", () => {
			const promotedSection = promotedChangelog.sections[1]
			expect(promotedSection.release).toStrictEqual(newRelease)
		})

		it("preserves the promoted items in the new release", () => {
			const promotedSection = promotedChangelog.sections[1]
			expect(promotedSection.sectionBody).toBe(
				changelog.sections[0].sectionBody,
			)
		})

		it("preserves the repository URL in the new release", () => {
			const promotedSection = promotedChangelog.sections[1]
			expect(promotedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("preserves the reference to the previous release in the new release", () => {
			const promotedSection = promotedChangelog.sections[1]
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

	describe("promoting the changelog", async () => {
		const newRelease: Release = {
			version: "10.12.9-beta.6",
			date: "2024-03-27",
		}
		const promotedChangelog = await promoteChangelog({
			originalChangelog: changelog,
			newRelease,
		})

		it("preserves the preamble", () => {
			expect(promotedChangelog.preamble).toBe(changelog.preamble)
		})

		it("inserts a new section", () => {
			expect(promotedChangelog.sections).toHaveLength(
				changelog.sections.length + 1,
			)
		})

		it("contains an empty unreleased section", () => {
			const unreleasedSection = promotedChangelog.sections[0]
			expect(unreleasedSection.release).toBeNull()
			expect(unreleasedSection.sectionBody).toBe("")
		})

		it("preserves the repository URL in the empty unreleased section", () => {
			const unreleasedSection = promotedChangelog.sections[0]
			expect(unreleasedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("makes the empty unreleased section refer back to the newly promoted release", () => {
			const unreleasedSection = promotedChangelog.sections[0]
			expect(unreleasedSection.previousRelease).toStrictEqual(newRelease)
		})

		it("promotes the existing unreleased section to become a new release", () => {
			const promotedSection = promotedChangelog.sections[1]
			expect(promotedSection.release).toStrictEqual(newRelease)
		})

		it("preserves the promoted items in the new release", () => {
			const promotedSection = promotedChangelog.sections[1]
			expect(promotedSection.sectionBody).toBe(
				changelog.sections[0].sectionBody,
			)
		})

		it("preserves the repository URL in the new release", () => {
			const promotedSection = promotedChangelog.sections[1]
			expect(promotedSection.repositoryUrl).toStrictEqual(
				changelog.sections[0].repositoryUrl,
			)
		})

		it("preserves the reference to the previous release in the new release", () => {
			const promotedSection = promotedChangelog.sections[1]
			expect(promotedSection.previousRelease).toStrictEqual(
				changelog.sections[0].previousRelease,
			)
		})

		it("preserves the existing release sections", () => {
			expect(promotedChangelog.sections[2]).toStrictEqual(changelog.sections[1])
			expect(promotedChangelog.sections[3]).toStrictEqual(changelog.sections[2])
		})
	})
})
