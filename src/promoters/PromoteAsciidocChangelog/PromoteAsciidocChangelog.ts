import { notNullish } from "#utilities/IterableUtilities"
import type { Release } from "#utilities/types/Release"
import {
	checkSequentialRelease,
	extractSemanticVersionString,
} from "#utilities/types/SemanticVersionString"

// Matches an unreleased section, including the heading and the body, which
// spans the characters after the heading until the next '==' heading or until
// the end of the string (trailing newlines are allowed).
// The heading may include an inline link to the GitHub repository.
const unreleasedSectionRegex =
	/\n== ((?<unreleasedRepositoryLink>\S+)\[unreleased\]|unreleased)(?<unreleasedBody>.*?)(?=\n== \S+\[(?<latestReleaseVersion>\S+)\]|\n*$)/isu

// Matches the path segment of a link to the repository.
const repositoryLinkPathRegex = /\/(?:compare|releases\/tag)\/v\S+/iu

// Matches trailing newline characters.
const trailingNewlinesRegex = /\n*$/u

export async function promoteAsciidocChangelog(
	originalContent: string,
	newRelease: Release,
): Promise<string> {
	const unreleasedSectionMatch = unreleasedSectionRegex.exec(originalContent)

	if (unreleasedSectionMatch === null) {
		throw new Error("must have an 'Unreleased' section")
	}

	const trimmedUnreleasedBody =
		unreleasedSectionMatch.groups?.unreleasedBody?.trim() ?? null

	if (!trimmedUnreleasedBody) {
		throw new Error("must have at least one item in the 'Unreleased' section")
	}

	const unreleasedRepositoryLink =
		unreleasedSectionMatch.groups?.unreleasedRepositoryLink ?? null

	if (unreleasedRepositoryLink === null) {
		throw new Error(
			"must have a link to the GitHub repository in the 'Unreleased' section",
		)
	}

	if (newRelease.checks.includes("sequential")) {
		const previousReleaseVersionRegex =
			/\[(?<version>\d+\.\d+\.\d+.*)\] - \d{4}-\d{2}-\d{2}\n/giu

		const previousReleaseVersions = Array.from(
			originalContent.matchAll(previousReleaseVersionRegex),
			(match) => {
				const version = match.groups?.version
				return version ? extractSemanticVersionString(version) : null
			},
		).filter(notNullish)

		checkSequentialRelease(newRelease.version, previousReleaseVersions)
	}

	const latestReleaseVersion =
		unreleasedSectionMatch.groups?.latestReleaseVersion ?? null

	const repositoryLink = unreleasedRepositoryLink.replace(
		repositoryLinkPathRegex,
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

	return (
		originalContent
			.replace(unreleasedSectionRegex, newReleaseSection)

			// Remove consecutive blank lines.
			.replace(/\n\n\n+/gu, "\n\n")

			// Insert exactly one blank line before '==' and '===' headings.
			.replace(/\n+(?====? )/gu, "\n\n")

			// Remove blank lines between a '==' heading and a '===' heading.
			.replace(/(?<=\n== .+)\n+(?=\n=== )/gu, "")

			// Insert exactly one trailing newline character.
			.replace(trailingNewlinesRegex, "\n")
	)
}
