import { parseAsciidocChangelog } from "+changelogs/AsciidocChangelogParser"
import { assertNotNullish } from "+utilities/ObjectUtilities"
import { dedent } from "+utilities/StringUtilities"
import { describe, expect, it } from "vitest"

const preambles = [
	dedent`
		= Changelog
		:experimental:
		:source-highlighter: highlight.js

		This file documents all notable changes to this project.
		The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].
	`,
	dedent`
		= Releases

		You can find all releases in this document.
	`,
]

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

describe("when the changelog is completely empty", () => {
	const asciidoc = ""
	const result = parseAsciidocChangelog(asciidoc)

	it("produces a changelog with an empty preamble", () => {
		expect(result.preamble).toBe("")
	})

	it("produces a changelog with no sections", () => {
		expect(result.sections).toHaveLength(0)
	})
})

describe.each`
	preamble
	${preambles[0]}
	${preambles[1]}
`(
	"when the changelog contains a non-empty preamble of $preamble and no other sections",
	(props: { preamble: string }) => {
		const asciidoc = props.preamble
		const result = parseAsciidocChangelog(asciidoc)

		it("produces a changelog with a preamble", () => {
			expect(result.preamble).toBe(props.preamble)
		})

		it("produces a changelog with no sections", () => {
			expect(result.sections).toHaveLength(0)
		})
	},
)

describe.each`
	heading                                                | body                           | expectedRepositoryUrl
	${"Unreleased"}                                        | ${sectionOfBathroomAppliances} | ${null}
	${"https://github.com/rainstormy/updraft[Unreleased]"} | ${sectionOfKitchenAppliances}  | ${"https://github.com/rainstormy/updraft"}
	${"{url-github}[Unreleased]"}                          | ${sectionOfOfficeAppliances}   | ${"{url-github}"}
`(
	"when the changelog contains a non-empty unreleased section with a heading of $heading",
	(props: {
		heading: string
		body: string
		expectedRepositoryUrl: string | null
	}) => {
		const asciidoc = dedent`
			${preambles[0]}

			== ${props.heading}
			${props.body}
		`
		const result = parseAsciidocChangelog(asciidoc)

		it("produces a changelog with a preamble", () => {
			expect(result.preamble).toBe(preambles[0])
		})

		it("produces a changelog with one section", () => {
			expect(result.sections).toHaveLength(1)
		})

		describe("the section", () => {
			it(`has a repository URL of '${props.expectedRepositoryUrl}'`, () => {
				assertNotNullish(result.sections[0])
				expect(result.sections[0].repositoryUrl).toBe(
					props.expectedRepositoryUrl,
				)
			})

			it("does not have a previous release", () => {
				assertNotNullish(result.sections[0])
				expect(result.sections[0].previousRelease).toBeNull()
			})

			it("is unreleased", () => {
				assertNotNullish(result.sections[0])
				expect(result.sections[0].release).toBeNull()
			})

			it("has a section body", () => {
				assertNotNullish(result.sections[0])
				expect(result.sections[0].sectionBody).toBe(props.body)
			})
		})
	},
)

describe("when the changelog contains an empty unreleased section and a non-empty released section", () => {
	const asciidoc = dedent`
		${preambles[0]}

		== https://github.com/spdiswal/coolciv/compare/v0.5.1\\...HEAD[Unreleased]

		== https://github.com/spdiswal/coolciv/releases/tag/v0.5.1[0.5.1] - 2022-12-22
		${sectionOfOfficeAppliances}
	`
	const result = parseAsciidocChangelog(asciidoc)

	it("produces a changelog with a preamble", () => {
		expect(result.preamble).toBe(preambles[0])
	})

	it("produces a changelog with two sections", () => {
		expect(result.sections).toHaveLength(2)
	})

	describe("the latest section", () => {
		it("has a repository URL", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].repositoryUrl).toBe(
				"https://github.com/spdiswal/coolciv",
			)
		})

		it("has a previous release", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].previousRelease).not.toBeNull()

			assertNotNullish(result.sections[0].previousRelease)
			expect(result.sections[0].previousRelease.version).toBe("0.5.1")
			expect(result.sections[0].previousRelease.date).toBe("2022-12-22")
		})

		it("is unreleased", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].release).toBeNull()
		})

		it("has an empty section body", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].sectionBody).toBe("")
		})
	})

	describe("the earliest section", () => {
		it("has a repository URL", () => {
			assertNotNullish(result.sections[1])
			expect(result.sections[1].repositoryUrl).toBe(
				"https://github.com/spdiswal/coolciv",
			)
		})

		it("does not have a previous release", () => {
			assertNotNullish(result.sections[1])
			expect(result.sections[1].previousRelease).toBeNull()
		})

		it("has a release version", () => {
			assertNotNullish(result.sections[1])
			assertNotNullish(result.sections[1].release)
			expect(result.sections[1].release.version).toBe("0.5.1")
		})

		it("has a release date", () => {
			assertNotNullish(result.sections[1])
			assertNotNullish(result.sections[1].release)
			expect(result.sections[1].release.date).toBe("2022-12-22")
		})

		it("has a section body", () => {
			assertNotNullish(result.sections[1])
			expect(result.sections[1].sectionBody).toBe(sectionOfOfficeAppliances)
		})
	})
})

describe("when the changelog contains a non-empty unreleased section and two earlier released sections", () => {
	const asciidoc = dedent`
		${preambles[0]}

		== {url-owner-repo}/compare/v0.1.2\\...HEAD[Unreleased]
		${sectionOfKitchenAppliances}

		== {url-owner-repo}/compare/v0.0.1\\...v0.1.2[0.1.2] - 2021-06-11
		${sectionOfOfficeAppliances}

		== {url-owner-repo}/releases/tag/v0.0.1[0.0.1] - 2021-05-04
		${sectionOfBathroomAppliances}
	`
	const result = parseAsciidocChangelog(asciidoc)

	it("produces a changelog with a preamble", () => {
		expect(result.preamble).toBe(preambles[0])
	})

	it("produces a changelog with three sections", () => {
		expect(result.sections).toHaveLength(3)
	})

	describe("the latest section", () => {
		it("has a repository URL", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].repositoryUrl).toBe("{url-owner-repo}")
		})

		it("has a previous release", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].previousRelease).not.toBeNull()

			assertNotNullish(result.sections[0].previousRelease)
			expect(result.sections[0].previousRelease.version).toBe("0.1.2")
			expect(result.sections[0].previousRelease.date).toBe("2021-06-11")
		})

		it("is unreleased", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].release).toBeNull()
		})

		it("has a section body", () => {
			assertNotNullish(result.sections[0])
			expect(result.sections[0].sectionBody).toBe(sectionOfKitchenAppliances)
		})
	})

	describe("the middle section", () => {
		it("has a repository URL", () => {
			assertNotNullish(result.sections[1])
			expect(result.sections[1].repositoryUrl).toBe("{url-owner-repo}")
		})

		it("has a previous release", () => {
			assertNotNullish(result.sections[1])
			expect(result.sections[1].previousRelease).not.toBeNull()

			assertNotNullish(result.sections[1].previousRelease)
			expect(result.sections[1].previousRelease.version).toBe("0.0.1")
			expect(result.sections[1].previousRelease.date).toBe("2021-05-04")
		})

		it("has a release version", () => {
			assertNotNullish(result.sections[1])
			assertNotNullish(result.sections[1].release)
			expect(result.sections[1].release.version).toBe("0.1.2")
		})

		it("has a release date", () => {
			assertNotNullish(result.sections[1])
			assertNotNullish(result.sections[1].release)
			expect(result.sections[1].release.date).toBe("2021-06-11")
		})

		it("has a section body", () => {
			assertNotNullish(result.sections[1])
			expect(result.sections[1].sectionBody).toBe(sectionOfOfficeAppliances)
		})
	})

	describe("the earliest section", () => {
		it("has a repository URL", () => {
			assertNotNullish(result.sections[2])
			expect(result.sections[2].repositoryUrl).toBe("{url-owner-repo}")
		})

		it("does not have a previous release", () => {
			assertNotNullish(result.sections[2])
			expect(result.sections[2].previousRelease).toBeNull()
		})

		it("has a release version", () => {
			assertNotNullish(result.sections[2])
			assertNotNullish(result.sections[2].release)
			expect(result.sections[2].release.version).toBe("0.0.1")
		})

		it("has a release date", () => {
			assertNotNullish(result.sections[2])
			assertNotNullish(result.sections[2].release)
			expect(result.sections[2].release.date).toBe("2021-05-04")
		})

		it("has a section body", () => {
			assertNotNullish(result.sections[2])
			expect(result.sections[2].sectionBody).toBe(sectionOfBathroomAppliances)
		})
	})
})

describe("when the changelog contains unnecessary blank lines", () => {
	const asciidoc = dedent`
		${preambles[0]}


		== https://github.com/spdiswal/coolciv/compare/v0.5.1\\...HEAD[Unreleased]

		${sectionOfKitchenAppliances}


		== https://github.com/spdiswal/coolciv/releases/tag/v0.5.1[0.5.1] - 2022-12-22

		${sectionOfOfficeAppliances}
	`
	const result = parseAsciidocChangelog(asciidoc)

	it("produces a changelog with a preamble", () => {
		expect(result.preamble).toBe(preambles[0])
	})

	it("produces a changelog with two sections", () => {
		expect(result.sections).toHaveLength(2)
	})
})
