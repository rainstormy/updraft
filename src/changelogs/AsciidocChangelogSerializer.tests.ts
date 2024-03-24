import { serializeChangelogToAsciidoc } from "+changelogs/AsciidocChangelogSerializer"
import type { Changelog } from "+changelogs/Changelog"
import { dedent } from "+utilities/StringUtilities"
import { describe, expect, it } from "vitest"

describe("when the changelog is completely empty", () => {
	const changelog: Changelog = {
		preamble: "",
		sections: [],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces an empty document", () => {
			expect(result).toBe("")
		})
	})
})

describe("when the changelog contains a preamble and no sections", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Releases

			You can find all releases in this document.
		`,
		sections: [],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with a preamble", () => {
			expect(result).toBe(dedent`
				= Releases

				You can find all releases in this document.
			`)
		})
	})
})

describe("when the changelog contains an unreleased section", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [
			{
				repositoryUrl: "https://github.com/rainstormy/updraft",
				previousRelease: {
					version: "3.0.1",
					date: "2021-06-04",
				},
				release: null,
				sectionBody: dedent`
					=== Added
					* A new shower mode: \`jet-stream\`.
				`,
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with an unreleased section whose heading is a hyperlink to a commit log since the previous release", () => {
			expect(result).toBe(dedent`
				= Changelog

				This is a changelog.


				== https://github.com/rainstormy/updraft/compare/v3.0.1\\...HEAD[Unreleased]

				=== Added
				* A new shower mode: \`jet-stream\`.
			`)
		})
	})
})

describe("when the changelog contains a released section", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Releases

			You can find all releases in this document.
		`,
		sections: [
			{
				repositoryUrl: "{url-github}",
				previousRelease: {
					version: "6.2.11",
					date: "2022-03-06",
				},
				release: {
					version: "6.3.0",
					date: "2022-03-19",
				},
				sectionBody: dedent`
					=== Changed
					* The fruit basket is now refilled every day.

					=== Fixed
					* The coffee machine will no longer produce ice cubes.
					* Milk in the refrigerator is now fresh.
				`,
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with a released section whose heading is a hyperlink to a commit log between the two releases", () => {
			expect(result).toBe(dedent`
				= Releases

				You can find all releases in this document.


				== {url-github}/compare/v6.2.11\\...v6.3.0[6.3.0] - 2022-03-19

				=== Changed
				* The fruit basket is now refilled every day.

				=== Fixed
				* The coffee machine will no longer produce ice cubes.
				* Milk in the refrigerator is now fresh.
			`)
		})
	})
})

describe("when the changelog contains an unreleased section without a link to the GitHub repository", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [
			{
				repositoryUrl: null,
				previousRelease: {
					version: "1.4.4",
					date: "2023-04-23",
				},
				release: null,
				sectionBody: dedent`
					=== Added
					* Soft toilet paper.
					* Ambient music.
				`,
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with an unreleased section whose heading is not a hyperlink", () => {
			expect(result).toBe(dedent`
				= Changelog

				This is a changelog.


				== Unreleased

				=== Added
				* Soft toilet paper.
				* Ambient music.
			`)
		})
	})
})

describe("when the changelog contains a released section without a link to the GitHub repository", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Releases

			You can find all releases in this document.
		`,
		sections: [
			{
				repositoryUrl: null,
				previousRelease: {
					version: "14.1.0",
					date: "2022-05-13",
				},
				release: {
					version: "14.1.1",
					date: "2022-05-16",
				},
				sectionBody: dedent`
					=== Fixed
					* Heating in toilet seats has been restored.
				`,
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with a released section whose heading is not a hyperlink", () => {
			expect(result).toBe(dedent`
				= Releases

				You can find all releases in this document.


				== 14.1.1 - 2022-05-16

				=== Fixed
				* Heating in toilet seats has been restored.
			`)
		})
	})
})

describe("when the changelog contains an unreleased section without a reference to a previous release", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [
			{
				repositoryUrl: "{url-repo}",
				previousRelease: null,
				release: null,
				sectionBody: dedent`
					=== Changed
					* The fruit basket is now refilled every day.
				`,
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with an unreleased section whose heading is a hyperlink to the home page of the GitHub repository", () => {
			expect(result).toBe(dedent`
				= Changelog

				This is a changelog.


				== {url-repo}[Unreleased]

				=== Changed
				* The fruit basket is now refilled every day.
			`)
		})
	})
})

describe("when the changelog contains a released section without a reference to a previous release", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Releases

			You can find all releases in this document.
		`,
		sections: [
			{
				repositoryUrl: "https://github.com/spdiswal/coolciv",
				previousRelease: null,
				release: {
					version: "5.9.0",
					date: "2023-01-29",
				},
				sectionBody: dedent`
					=== Added
					* A new cold water dispenser.
					* Skylights in the ceiling.

					=== Removed
					* Dust on the floor.
				`,
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with a released section whose heading is a hyperlink to the release tag", () => {
			expect(result).toBe(dedent`
				= Releases

				You can find all releases in this document.


				== https://github.com/spdiswal/coolciv/releases/tag/v5.9.0[5.9.0] - 2023-01-29

				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.

				=== Removed
				* Dust on the floor.
			`)
		})
	})
})

describe("when the changelog contains an empty unreleased section", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog

			This is a changelog.
		`,
		sections: [
			{
				repositoryUrl: "{github-repository-base-url}",
				previousRelease: {
					version: "0.4.9-beta.1",
					date: "2022-09-26",
				},
				release: null,
				sectionBody: "",
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with an unreleased section that does not have a body", () => {
			expect(result).toBe(dedent`
				= Changelog

				This is a changelog.


				== {github-repository-base-url}/compare/v0.4.9-beta.1\\...HEAD[Unreleased]
			`)
		})
	})
})

describe("when the changelog contains an empty released section", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Releases

			You can find all releases in this document.
		`,
		sections: [
			{
				repositoryUrl: "https://github.com/rainstormy/presets-web",
				previousRelease: {
					version: "2.0.0-beta.5+20231116153649",
					date: "2023-11-16",
				},
				release: {
					version: "2.0.0",
					date: "2023-11-17",
				},
				sectionBody: "",
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with a released section that does not have a body", () => {
			expect(result).toBe(dedent`
				= Releases

				You can find all releases in this document.


				== https://github.com/rainstormy/presets-web/compare/v2.0.0-beta.5+20231116153649\\...v2.0.0[2.0.0] - 2023-11-17
			`)
		})
	})
})

describe("when the changelog contains a preamble, an unreleased section, and three released sections", () => {
	const changelog: Changelog = {
		preamble: dedent`
			= Changelog
			:experimental:
			:source-highlighter: highlight.js

			This file documents all notable changes to this project.
			The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].
		`,
		sections: [
			{
				repositoryUrl:
					"https://github.com/rainstormy/github-action-validate-commit-messages",
				previousRelease: {
					version: "1.1.0",
					date: "2023-05-04",
				},
				release: null,
				sectionBody: dedent`
					=== Fixed
					* Reduce the bundle size downloaded by the GitHub Actions runner. The tarball archive exported by GitHub no longer contains Yarn PnP binaries and development-related files.
				`,
			},
			{
				repositoryUrl:
					"https://github.com/rainstormy/github-action-validate-commit-messages",
				previousRelease: {
					version: "1.0.1",
					date: "2023-04-17",
				},
				release: {
					version: "1.1.0",
					date: "2023-05-04",
				},
				sectionBody: dedent`
					=== Added
					* New rule: \`unique-subject-lines\`.

					=== Fixed
					* Ignore semantic version updates (i.e. subject lines that end with \`to X.Y.Z\`) in the \`limit-length-of-subject-lines\` rule.
					* Ignore lines that contain an \`https://\` URL in the \`limit-length-of-body-lines\` rule.
				`,
			},
			{
				repositoryUrl:
					"https://github.com/rainstormy/github-action-validate-commit-messages",
				previousRelease: {
					version: "1.0.0",
					date: "2023-04-01",
				},
				release: {
					version: "1.0.1",
					date: "2023-04-17",
				},
				sectionBody: dedent`
					=== Added
					* https://choosealicense.com/licenses/mit[MIT license].

					=== Fixed
					* Recognise \`scaffold\` as a verb in the \`imperative-subject-lines\` rule.
				`,
			},
			{
				repositoryUrl:
					"https://github.com/rainstormy/github-action-validate-commit-messages",
				previousRelease: null,
				release: {
					version: "1.0.0",
					date: "2023-04-01",
				},
				sectionBody: dedent`
					=== Added
					* GitHub Actions entrypoint.
					* New rule: \`acknowledged-author-email-addresses\`.
					* New rule: \`acknowledged-author-names\`.
					* New rule: \`acknowledged-committer-email-addresses\`.
					* New rule: \`acknowledged-committer-names\`.
					* New rule: \`capitalised-subject-lines\`.
					* New rule: \`empty-line-after-subject-lines\`.
					* New rule: \`imperative-subject-lines\`.
					* New rule: \`issue-references-in-subject-lines\`.
					* New rule: \`limit-length-of-body-lines\`.
					* New rule: \`limit-length-of-subject-lines\`.
					* New rule: \`multi-word-subject-lines\`.
					* New rule: \`no-co-authors\`.
					* New rule: \`no-merge-commits\`.
					* New rule: \`no-revert-revert-commits\`.
					* New rule: \`no-squash-commits\`.
					* New rule: \`no-trailing-punctuation-in-subject-lines\`.
					* New rule: \`no-unexpected-whitespace\`.
				`,
			},
		],
	}

	describe("serialising the changelog to AsciiDoc", () => {
		const result = serializeChangelogToAsciidoc(changelog)

		it("produces a document with a preamble and four sections in total", () => {
			expect(result).toBe(dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js

				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].


				== https://github.com/rainstormy/github-action-validate-commit-messages/compare/v1.1.0\\...HEAD[Unreleased]

				=== Fixed
				* Reduce the bundle size downloaded by the GitHub Actions runner. The tarball archive exported by GitHub no longer contains Yarn PnP binaries and development-related files.


				== https://github.com/rainstormy/github-action-validate-commit-messages/compare/v1.0.1\\...v1.1.0[1.1.0] - 2023-05-04

				=== Added
				* New rule: \`unique-subject-lines\`.

				=== Fixed
				* Ignore semantic version updates (i.e. subject lines that end with \`to X.Y.Z\`) in the \`limit-length-of-subject-lines\` rule.
				* Ignore lines that contain an \`https://\` URL in the \`limit-length-of-body-lines\` rule.


				== https://github.com/rainstormy/github-action-validate-commit-messages/compare/v1.0.0\\...v1.0.1[1.0.1] - 2023-04-17

				=== Added
				* https://choosealicense.com/licenses/mit[MIT license].

				=== Fixed
				* Recognise \`scaffold\` as a verb in the \`imperative-subject-lines\` rule.


				== https://github.com/rainstormy/github-action-validate-commit-messages/releases/tag/v1.0.0[1.0.0] - 2023-04-01

				=== Added
				* GitHub Actions entrypoint.
				* New rule: \`acknowledged-author-email-addresses\`.
				* New rule: \`acknowledged-author-names\`.
				* New rule: \`acknowledged-committer-email-addresses\`.
				* New rule: \`acknowledged-committer-names\`.
				* New rule: \`capitalised-subject-lines\`.
				* New rule: \`empty-line-after-subject-lines\`.
				* New rule: \`imperative-subject-lines\`.
				* New rule: \`issue-references-in-subject-lines\`.
				* New rule: \`limit-length-of-body-lines\`.
				* New rule: \`limit-length-of-subject-lines\`.
				* New rule: \`multi-word-subject-lines\`.
				* New rule: \`no-co-authors\`.
				* New rule: \`no-merge-commits\`.
				* New rule: \`no-revert-revert-commits\`.
				* New rule: \`no-squash-commits\`.
				* New rule: \`no-trailing-punctuation-in-subject-lines\`.
				* New rule: \`no-unexpected-whitespace\`.
			`)
		})
	})
})
