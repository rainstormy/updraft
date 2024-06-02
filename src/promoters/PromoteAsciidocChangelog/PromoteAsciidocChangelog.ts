import type { Release } from "+utilities/Release"
import { ensureTrailingNewlineIfNonEmpty } from "+utilities/StringUtilities"

// Matches the unreleased section, including the heading and the body,
// which spans the characters after the heading until the next '==' heading
// or until the end of the string.
const unreleasedSectionRegex =
	/\n== ((?<unreleasedRepositoryLink>\S+)\[Unreleased\]|Unreleased)(?<unreleasedBody>.*?)(?=\n== (?<previousReleaseRepositoryLink>\S+)\[(?<previousReleaseVersion>\S+)\]|$)/su

// Matches one blank line after a '==' heading,
// except for a blank line directly between two '==' headings.
const redundantBlankLinesAfterHeadingRegex = /(?<=== .+)\n\n(?!== )/gu

// Matches two or more consecutive blank lines.
const redundantMultipleBlankLinesRegex = /\n\n\n+/gu

export async function promoteAsciidocChangelog(
	originalContent: string,
	newRelease: Release,
): Promise<string> {
	const unreleasedHeading = unreleasedSectionRegex.exec(originalContent)

	if (unreleasedHeading === null) {
		throw new Error("must have an 'Unreleased' section")
	}

	const unreleasedRepositoryLink =
		unreleasedHeading.groups?.unreleasedRepositoryLink ?? null
	const trimmedUnreleasedBody =
		unreleasedHeading.groups?.unreleasedBody?.trim() ?? null
	const previousReleaseVersion =
		unreleasedHeading.groups?.previousReleaseVersion ?? null

	if (unreleasedRepositoryLink === null) {
		throw new Error(
			"must have a link to the GitHub repository in the 'Unreleased' section",
		)
	}
	if (trimmedUnreleasedBody === null || trimmedUnreleasedBody === "") {
		throw new Error("must have at least one item in the 'Unreleased' section")
	}

	const repositoryLink = unreleasedRepositoryLink.replace(
		/\/(compare|releases\/tag)\/v\S+/u,
		"",
	)

	const newUnreleasedHeading = `== ${repositoryLink}/compare/v${newRelease.version}\\...HEAD[Unreleased]`
	const newReleaseRepositoryLink =
		previousReleaseVersion !== null
			? `${repositoryLink}/compare/v${previousReleaseVersion}\\...v${newRelease.version}`
			: `${repositoryLink}/releases/tag/v${newRelease.version}`
	const newReleaseHeading = `== ${newReleaseRepositoryLink}[${newRelease.version}] - ${newRelease.date}`
	const newReleaseSection = `\n${newUnreleasedHeading}\n\n${newReleaseHeading}\n${trimmedUnreleasedBody}\n`

	return ensureTrailingNewlineIfNonEmpty(
		originalContent
			.replace(unreleasedSectionRegex, newReleaseSection)
			.replace(redundantMultipleBlankLinesRegex, "\n\n")
			.replace(redundantBlankLinesAfterHeadingRegex, "\n"),
	)
}
