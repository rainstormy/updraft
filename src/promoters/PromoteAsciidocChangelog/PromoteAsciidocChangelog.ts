import type { Release } from "+utilities/Release"
import { ensureTrailingNewlineIfNonEmpty } from "+utilities/StringUtilities"

// Matches an unreleased section, including the heading and the body, which
// spans the characters after the heading until the next '==' heading or until
// the end of the string (trailing newlines are allowed).
// The heading may include an inline link to the GitHub repository.
const unreleasedSectionRegex =
	/\n== ((?<unreleasedRepositoryLink>\S+)\[unreleased\]|unreleased)(?<unreleasedBody>.*?)(?=\n== \S+\[(?<latestReleaseVersion>\S+)\]|\n*$)/isu

// Matches one blank line after a '==' heading,
// except for a blank line directly between two '==' headings.
const redundantBlankLinesAfterHeadingRegex = /(?<=== .+)\n\n(?!== )/gu

// Matches two or more consecutive blank lines.
const redundantMultipleBlankLinesRegex = /\n\n\n+/gu

export async function promoteAsciidocChangelog(
	originalContent: string,
	newRelease: Release,
): Promise<string> {
	const unreleasedSection = unreleasedSectionRegex.exec(originalContent)

	if (unreleasedSection === null) {
		throw new Error("must have an 'Unreleased' section")
	}

	const trimmedUnreleasedBody =
		unreleasedSection.groups?.unreleasedBody?.trim() ?? null

	if (trimmedUnreleasedBody === null || trimmedUnreleasedBody === "") {
		throw new Error("must have at least one item in the 'Unreleased' section")
	}

	const unreleasedRepositoryLink =
		unreleasedSection.groups?.unreleasedRepositoryLink ?? null

	if (unreleasedRepositoryLink === null) {
		throw new Error(
			"must have a link to the GitHub repository in the 'Unreleased' section",
		)
	}

	const latestReleaseVersion =
		unreleasedSection.groups?.latestReleaseVersion ?? null

	const repositoryLink = unreleasedRepositoryLink.replace(
		/\/(compare|releases\/tag)\/v\S+/iu,
		"",
	)
	const newUnreleasedLink = `${repositoryLink}/compare/v${newRelease.version}\\...HEAD`
	const newReleaseLink = `${repositoryLink}${
		latestReleaseVersion !== null
			? `/compare/v${latestReleaseVersion}\\...v${newRelease.version}`
			: `/releases/tag/v${newRelease.version}`
	}`

	const newUnreleasedHeading = `== ${newUnreleasedLink}[Unreleased]`
	const newReleaseHeading = `== ${newReleaseLink}[${newRelease.version}] - ${newRelease.date}`
	const newReleaseSection = `\n${newUnreleasedHeading}\n\n${newReleaseHeading}\n${trimmedUnreleasedBody}\n`

	return ensureTrailingNewlineIfNonEmpty(
		originalContent
			.replace(unreleasedSectionRegex, newReleaseSection)
			.replace(redundantMultipleBlankLinesRegex, "\n\n")
			.replace(redundantBlankLinesAfterHeadingRegex, "\n"),
	)
}
