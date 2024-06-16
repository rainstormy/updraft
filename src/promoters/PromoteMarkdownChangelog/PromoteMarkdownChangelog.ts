import type { Release } from "+utilities/Release"

// Matches an unreleased section, including the heading and the body, which
// spans the characters after the heading until the next '##' heading or until
// the end of the string (trailing newlines are allowed).
// The heading may include an inline link to the GitHub repository.
const unreleasedSectionRegex =
	/\n## (?:\[unreleased\](?:\((?<unreleasedRepositoryLink>\S+)\))?|unreleased)(?<unreleasedBody>.*?)(?=\n## \[(?<latestReleaseVersion>\S+)\]|\n*$)/isu

// Matches a trailing link to the GitHub repository for an unreleased section.
const unreleasedTrailingLinkRegex =
	/\n\[unreleased\]: (?<unreleasedRepositoryLink>\S+)(?=\n+\[\S+\]: |\n*$)/iu

export async function promoteMarkdownChangelog(
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

	const trailingLinks = unreleasedTrailingLinkRegex.exec(originalContent)
	const unreleasedRepositoryLink =
		trailingLinks?.groups?.unreleasedRepositoryLink ??
		unreleasedSection.groups?.unreleasedRepositoryLink ??
		null

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
	const newUnreleasedLink = `${repositoryLink}/compare/v${newRelease.version}...HEAD`
	const newReleaseLink = `${repositoryLink}${
		latestReleaseVersion !== null
			? `/compare/v${latestReleaseVersion}...v${newRelease.version}`
			: `/releases/tag/v${newRelease.version}`
	}`

	const newUnreleasedHeading =
		trailingLinks !== null
			? "## [Unreleased]"
			: `## [Unreleased](${newUnreleasedLink})`
	const newReleaseHeading =
		trailingLinks !== null
			? `## [${newRelease.version}] - ${newRelease.date}`
			: `## [${newRelease.version}](${newReleaseLink}) - ${newRelease.date}`
	const newReleaseSection = `\n${newUnreleasedHeading}\n\n${newReleaseHeading}\n${trimmedUnreleasedBody}\n`

	const newTrailingLinks =
		trailingLinks !== null
			? `\n[unreleased]: ${newUnreleasedLink}\n[${newRelease.version}]: ${newReleaseLink}`
			: ""

	return (
		originalContent
			.replace(unreleasedSectionRegex, newReleaseSection)
			.replace(unreleasedTrailingLinkRegex, newTrailingLinks)

			// Remove consecutive blank lines.
			.replace(/\n\n\n+/gu, "\n\n")

			// Insert exactly one blank line before '##' and '###' headings.
			.replace(/\n+(?=###? )/gu, "\n\n")

			// Remove blank lines between a '##' heading and a '###' heading.
			.replace(/(?<=\n## .+)\n+(?=\n### )/gu, "")

			// Insert exactly one blank line before each trailing link.
			.replace(/\n+(?=\[\S+\]: )/gu, "\n\n")

			// Remove blank lines between two trailing links.
			.replace(/(?<=\[\S+\]: .+)\n+(?=\[\S+\]: )/gu, "\n")

			// Insert exactly one trailing newline character.
			.replace(/\n*$/u, "\n")
	)
}
