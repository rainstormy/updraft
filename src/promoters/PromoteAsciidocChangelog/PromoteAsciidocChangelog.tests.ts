import { promoteAsciidocChangelog } from "+promoters/PromoteAsciidocChangelog/PromoteAsciidocChangelog"
import type { Release } from "+utilities/Release"
import {
	type DateString,
	type SemanticVersionString,
	dedent,
} from "+utilities/StringUtilities"
import { describe, expect, it } from "vitest"

describe.each`
	releaseVersion      | releaseDate     | githubRepositoryUrl
	${"0.12.7"}         | ${"2023-05-04"} | ${"https://github.com/rainstormy/updraft"}
	${"1.0.0"}          | ${"2018-06-26"} | ${"https://github.com/spdiswal/coolciv"}
	${"2.1.6"}          | ${"2022-07-01"} | ${"{url-github}"}
	${"10.12.9-beta.6"} | ${"2021-09-25"} | ${"{repository}"}
`(
	"when the new release is $releaseVersion on $releaseDate and the GitHub repository URL is $githubRepositoryUrl",
	(releaseProps: {
		releaseVersion: SemanticVersionString
		releaseDate: DateString
		githubRepositoryUrl: string
	}) => {
		const release: Release = {
			version: releaseProps.releaseVersion,
			date: releaseProps.releaseDate,
		}

		describe("and the changelog is completely empty", () => {
			const originalContent = ""

			it("raises an error", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).rejects.toThrow("must have an 'Unreleased' section")
			})
		})

		describe("and the changelog has a preamble and no other sections", () => {
			const originalContent = dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js
				:url-github-repository: ${releaseProps.githubRepositoryUrl}

				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].
			`

			it("raises an error", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).rejects.toThrow("must have an 'Unreleased' section")
			})
		})

		describe("and the changelog contains an empty unreleased section and no prior releases", () => {
			const originalContent = dedent`
				= Releases

				You can find all releases in this document.

				== ${releaseProps.githubRepositoryUrl}[Unreleased]
			`

			it("raises an error", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).rejects.toThrow(
					"must have at least one item in the 'Unreleased' section",
				)
			})
		})

		describe("and the changelog contains an empty unreleased section and one prior release", () => {
			const originalContent = dedent`
				= Releases

				You can find all releases in this document.

				== ${releaseProps.githubRepositoryUrl}[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v0.1.0[0.1.0] - 2023-04-01
				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.

				=== Fixed
				* Milk in the refrigerator is now fresh.
			`

			it("raises an error", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).rejects.toThrow(
					"must have at least one item in the 'Unreleased' section",
				)
			})
		})

		describe("and the changelog contains a non-empty unreleased section without a link to the GitHub repository", () => {
			const originalContent = dedent`
				= Changelog

				This is a changelog.

				== Unreleased
				=== Fixed
				* Heating in toilet seats has been restored.
			`

			it("raises an error", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).rejects.toThrow(
					"must have a link to the GitHub repository in the 'Unreleased' section",
				)
			})
		})

		describe("and the changelog contains a non-empty unreleased section and no prior releases", () => {
			const originalContent = dedent`
				= Releases

				You can find all releases in this document.

				== ${releaseProps.githubRepositoryUrl}[Unreleased]
				=== Added
				* A new shower mode: \`jet-stream\`.
			`
			const expectedPromotedContent = `${dedent`
				= Releases

				You can find all releases in this document.

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v${release.version}[${release.version}] - ${release.date}
				=== Added
				* A new shower mode: \`jet-stream\`.
			`}\n`

			it("promotes the unreleased section and inserts a new empty unreleased section", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})

		describe("and the changelog contains a non-empty unreleased section and one prior release", () => {
			const originalContent = dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js
				:url-github-repository: ${releaseProps.githubRepositoryUrl}

				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

				== ${releaseProps.githubRepositoryUrl}/compare/v10.0.0\\...HEAD[Unreleased]
				=== Added
				* A hot chocolate machine for the office.

				=== Changed
				* The fruit basket is now refilled every day.

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v10.0.0[10.0.0] - 2022-12-22
				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.

				=== Fixed
				* Milk in the refrigerator is now fresh.
			`
			const expectedPromotedContent = `${dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js
				:url-github-repository: ${releaseProps.githubRepositoryUrl}

				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/compare/v10.0.0\\...v${release.version}[${release.version}] - ${release.date}
				=== Added
				* A hot chocolate machine for the office.

				=== Changed
				* The fruit basket is now refilled every day.

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v10.0.0[10.0.0] - 2022-12-22
				=== Added
				* A new cold water dispenser.
				* Skylights in the ceiling.

				=== Fixed
				* Milk in the refrigerator is now fresh.
			`}\n`

			it("promotes the unreleased section and inserts a new empty unreleased section", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})

		describe("and the changelog contains a non-empty unreleased section and seven prior releases", () => {
			const originalContent = dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js

				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.4\\...HEAD[Unreleased]
				=== Fixed
				* Recognise \`alias\`, \`inline\`, \`proxy\`, and \`reroute\` as verbs in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.3\\...v1.1.4[1.1.4] - 2023-12-18
				=== Fixed
				* Recognise \`coauthor\`/\`co-author\`, \`colocate\`/\`co-locate\`, \`collocate\`, \`copilot\`/\`co-pilot\`,
				\`deauthenticate\`, \`deauthorise\`/\`deauthorize\`, \`deorbit\`, \`parameterise\`/\`parameterize\`/\`parametrise\`/\`parametrize\`, \`remix\`, and \`unauthorise\`/\`unauthorize\` as verbs in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.2\\...v1.1.3[1.1.3] - 2023-11-03
				=== Fixed
				* Recognise \`decouple\` as a verb in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.1\\...v1.1.2[1.1.2] - 2023-10-20
				=== Changed
				* Run on Node.js 20, as Node.js 16 is to https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20[become obsolete in GitHub Actions].
				This change should neither require any changes to your workflow files nor affect the visible behaviour of this action.
				Hence, it is not considered to be a breaking change.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.0\\...v1.1.1[1.1.1] - 2023-09-09
				=== Fixed
				* Reduce the bundle size downloaded by the GitHub Actions runner.
				The tarball archive exported by GitHub no longer contains Yarn PnP binaries.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.0.1\\...v1.1.0[1.1.0] - 2023-05-04
				=== Added
				* New rule: \`unique-subject-lines\`.

				=== Fixed
				* Ignore semantic version updates (i.e. subject lines that end with \`to X.Y.Z\`) in the \`limit-length-of-subject-lines\` rule.
				* Ignore lines that contain an \`https://\` URL in the \`limit-length-of-body-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.0.0\\...v1.0.1[1.0.1] - 2023-04-17
				=== Added
				* https://choosealicense.com/licenses/mit[MIT license].

				=== Fixed
				* Recognise \`scaffold\` as a verb in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v1.0.0[1.0.0] - 2023-04-01
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
			`
			const expectedPromotedContent = `${dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js

				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.4\\...v${release.version}[${release.version}] - ${release.date}
				=== Fixed
				* Recognise \`alias\`, \`inline\`, \`proxy\`, and \`reroute\` as verbs in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.3\\...v1.1.4[1.1.4] - 2023-12-18
				=== Fixed
				* Recognise \`coauthor\`/\`co-author\`, \`colocate\`/\`co-locate\`, \`collocate\`, \`copilot\`/\`co-pilot\`,
				\`deauthenticate\`, \`deauthorise\`/\`deauthorize\`, \`deorbit\`, \`parameterise\`/\`parameterize\`/\`parametrise\`/\`parametrize\`, \`remix\`, and \`unauthorise\`/\`unauthorize\` as verbs in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.2\\...v1.1.3[1.1.3] - 2023-11-03
				=== Fixed
				* Recognise \`decouple\` as a verb in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.1\\...v1.1.2[1.1.2] - 2023-10-20
				=== Changed
				* Run on Node.js 20, as Node.js 16 is to https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20[become obsolete in GitHub Actions].
				This change should neither require any changes to your workflow files nor affect the visible behaviour of this action.
				Hence, it is not considered to be a breaking change.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.1.0\\...v1.1.1[1.1.1] - 2023-09-09
				=== Fixed
				* Reduce the bundle size downloaded by the GitHub Actions runner.
				The tarball archive exported by GitHub no longer contains Yarn PnP binaries.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.0.1\\...v1.1.0[1.1.0] - 2023-05-04
				=== Added
				* New rule: \`unique-subject-lines\`.

				=== Fixed
				* Ignore semantic version updates (i.e. subject lines that end with \`to X.Y.Z\`) in the \`limit-length-of-subject-lines\` rule.
				* Ignore lines that contain an \`https://\` URL in the \`limit-length-of-body-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/compare/v1.0.0\\...v1.0.1[1.0.1] - 2023-04-17
				=== Added
				* https://choosealicense.com/licenses/mit[MIT license].

				=== Fixed
				* Recognise \`scaffold\` as a verb in the \`imperative-subject-lines\` rule.

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v1.0.0[1.0.0] - 2023-04-01
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
			`}\n`

			it("promotes the unreleased section and inserts a new empty unreleased section", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})

		describe("and the changelog contains a non-empty unreleased section and two prior empty releases", () => {
			const originalContent = dedent`
				= Changelog

				This is a changelog.

				== ${releaseProps.githubRepositoryUrl}/compare/v2.0.0-beta.5+20231116153649\\...HEAD[Unreleased]
				=== Added
				* A hot chocolate machine for the office.

				=== Changed
				* The fruit basket is now refilled every day.

				== ${releaseProps.githubRepositoryUrl}/compare/v0.4.9-beta.1\\...v2.0.0-beta.5+20231116153649[2.0.0-beta.5+20231116153649] - 2023-11-17

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v0.4.9-beta.1[0.4.9-beta.1] - 2023-11-16
			`
			const expectedPromotedContent = `${dedent`
				= Changelog

				This is a changelog.

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/compare/v2.0.0-beta.5+20231116153649\\...v${release.version}[${release.version}] - ${release.date}
				=== Added
				* A hot chocolate machine for the office.

				=== Changed
				* The fruit basket is now refilled every day.

				== ${releaseProps.githubRepositoryUrl}/compare/v0.4.9-beta.1\\...v2.0.0-beta.5+20231116153649[2.0.0-beta.5+20231116153649] - 2023-11-17

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v0.4.9-beta.1[0.4.9-beta.1] - 2023-11-16
			`}\n`

			it("preserves the empty releases", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})

		describe("and the changelog contains a non-empty unreleased section in alternating case", () => {
			const originalContent = dedent`
				= Releases

				You can find all releases in this document.

				== ${releaseProps.githubRepositoryUrl}[uNrElEaSeD]
				=== Added
				* A new shower mode: \`jet-stream\`.
			`
			const expectedPromotedContent = `${dedent`
				= Releases

				You can find all releases in this document.

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v${release.version}[${release.version}] - ${release.date}
				=== Added
				* A new shower mode: \`jet-stream\`.
			`}\n`

			it("normalises the case in the new unreleased section", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})

		describe("and the changelog contains redundant blank lines between sections", () => {
			const originalContent = dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js
				:url-github-repository: ${releaseProps.githubRepositoryUrl}


				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].


				== ${releaseProps.githubRepositoryUrl}/compare/v0.1.2\\...HEAD[Unreleased]

				=== Added
				* A hot chocolate machine for the office.
				* New coffee modes: \`espresso\` and \`cappuccino\`.


				=== Changed
				* The fruit basket is now refilled every day.


				=== Fixed
				* The coffee machine will no longer produce ice cubes.
				* Milk in the refrigerator is now fresh.



				== ${releaseProps.githubRepositoryUrl}/compare/v0.0.1\\...v0.1.2[0.1.2] - 2021-06-11


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


				== ${releaseProps.githubRepositoryUrl}/releases/tag/v0.0.1[0.0.1] - 2021-05-04


				=== Added
				* A new shower mode: \`jet-stream\`.
				* Soft toilet paper.
				* Ambient music.

				=== Fixed
				* Heating in toilet seats has been restored.
			`
			const expectedPromotedContent = `${dedent`
				= Changelog
				:experimental:
				:source-highlighter: highlight.js
				:url-github-repository: ${releaseProps.githubRepositoryUrl}

				This file documents all notable changes to this project.
				The format is based on https://keepachangelog.com/en/1.1.0[Keep a Changelog], and this project adheres to https://semver.org/spec/v2.0.0.html[Semantic Versioning].

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/compare/v0.1.2\\...v${release.version}[${release.version}] - ${release.date}
				=== Added
				* A hot chocolate machine for the office.
				* New coffee modes: \`espresso\` and \`cappuccino\`.

				=== Changed
				* The fruit basket is now refilled every day.

				=== Fixed
				* The coffee machine will no longer produce ice cubes.
				* Milk in the refrigerator is now fresh.

				== ${releaseProps.githubRepositoryUrl}/compare/v0.0.1\\...v0.1.2[0.1.2] - 2021-06-11
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

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v0.0.1[0.0.1] - 2021-05-04
				=== Added
				* A new shower mode: \`jet-stream\`.
				* Soft toilet paper.
				* Ambient music.

				=== Fixed
				* Heating in toilet seats has been restored.
			`}\n`

			it("preserves at most one blank line between sections", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})

		describe("and the changelog does not have blank lines between sections", () => {
			const originalContent = `${dedent`
				= Changelog
				== ${releaseProps.githubRepositoryUrl}/compare/v4.3.0\\...HEAD[Unreleased]
				=== Added
				* Custom height presets for sit-to-stand desks.
				=== Changed
				* Increased the maximum height for sit-to-stand desks.
				=== Fixed
				* Control panel buttons are now correctly labelled.
				== ${releaseProps.githubRepositoryUrl}/releases/tag/v4.3.0[4.3.0] - 2024-06-15
				=== Added
				* Sit-to-stand desks.
			`}\n\n`
			const expectedPromotedContent = `${dedent`
				= Changelog

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/compare/v4.3.0\\...v${release.version}[${release.version}] - ${release.date}
				=== Added
				* Custom height presets for sit-to-stand desks.

				=== Changed
				* Increased the maximum height for sit-to-stand desks.

				=== Fixed
				* Control panel buttons are now correctly labelled.

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v4.3.0[4.3.0] - 2024-06-15
				=== Added
				* Sit-to-stand desks.
			`}\n`

			it("inserts a blank line before each section", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})

		describe("and the changelog contains trailing blank lines", () => {
			const originalContent = `${dedent`
				= Changelog

				== ${releaseProps.githubRepositoryUrl}/compare/v4.3.0\\...HEAD[Unreleased]
				=== Added
				* Custom height presets for sit-to-stand desks.

				=== Changed
				* Increased the maximum height for sit-to-stand desks.

				=== Fixed
				* Control panel buttons are now correctly labelled.

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v4.3.0[4.3.0] - 2024-06-15
				=== Added
				* Sit-to-stand desks.
			`}\n\n`
			const expectedPromotedContent = `${dedent`
				= Changelog

				== ${releaseProps.githubRepositoryUrl}/compare/v${release.version}\\...HEAD[Unreleased]

				== ${releaseProps.githubRepositoryUrl}/compare/v4.3.0\\...v${release.version}[${release.version}] - ${release.date}
				=== Added
				* Custom height presets for sit-to-stand desks.

				=== Changed
				* Increased the maximum height for sit-to-stand desks.

				=== Fixed
				* Control panel buttons are now correctly labelled.

				== ${releaseProps.githubRepositoryUrl}/releases/tag/v4.3.0[4.3.0] - 2024-06-15
				=== Added
				* Sit-to-stand desks.
			`}\n`

			it("preserves one trailing newline", async () => {
				await expect(
					promoteAsciidocChangelog(originalContent, release),
				).resolves.toBe(expectedPromotedContent)
			})
		})
	},
)
