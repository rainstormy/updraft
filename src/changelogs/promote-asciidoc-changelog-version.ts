import type { DateString, SemanticVersionString } from "+utilities"

export type PromoteChangelogOptions = {
	readonly originalContent: string
	readonly versionToRelease: SemanticVersionString
	readonly releaseDate: DateString
}

export type PromoteChangelogResult =
	| PromoteChangelogResult.Succeeded
	| PromoteChangelogResult.Failed

export namespace PromoteChangelogResult {
	export type Succeeded = {
		readonly status: "succeeded"
		readonly content: string
	}

	export type Failed = {
		readonly status: "failed"
		readonly errorMessage: string
	}
}

export function promoteAsciidocChangelogVersion(
	options: PromoteChangelogOptions,
): PromoteChangelogResult {
	const lines = options.originalContent.split("\n")
	const hasUnreleasedSectionHeadingWithoutGithubLink =
		lines.includes("== Unreleased")

	if (hasUnreleasedSectionHeadingWithoutGithubLink) {
		return {
			status: "failed",
			errorMessage:
				"The 'Unreleased' section in the changelog must include a link to the GitHub repository",
		}
	}

	const unreleasedSectionHeadingIndex = lines.findIndex(
		(line) => isHeading(line) && line.endsWith("[Unreleased]"),
	)

	if (unreleasedSectionHeadingIndex === -1) {
		return {
			status: "failed",
			errorMessage: "The 'Unreleased' section is missing in the changelog",
		}
	}

	const nextSectionHeadingIndex = lines.findIndex(
		(line, index) => index > unreleasedSectionHeadingIndex && isHeading(line),
	)

	const linesBetweenUnreleasedSectionHeadingAndNextSectionHeading =
		nextSectionHeadingIndex === -1
			? lines.slice(unreleasedSectionHeadingIndex + 1)
			: lines.slice(unreleasedSectionHeadingIndex + 1, nextSectionHeadingIndex)

	const numberOfUnreleasedItems =
		linesBetweenUnreleasedSectionHeadingAndNextSectionHeading.filter(
			(line) => line.trim().length > 0,
		).length

	if (numberOfUnreleasedItems === 0) {
		return {
			status: "failed",
			errorMessage:
				"The 'Unreleased' section in the changelog must contain at least one item",
		}
	}

	const unreleasedSectionHeading = lines[unreleasedSectionHeadingIndex]
	const unreleasedDescription = unreleasedSectionHeading.substring(
		"== ".length,
		unreleasedSectionHeading.length - "[Unreleased]".length,
	)

	const githubRepositoryUrl = getGithubRepositoryUrl(unreleasedDescription)

	const latestReleaseSectionHeading = lines[nextSectionHeadingIndex] ?? null

	const latestVersion =
		latestReleaseSectionHeading !== null
			? getLatestVersion(latestReleaseSectionHeading)
			: null

	const updatedLines = [
		...lines.slice(0, unreleasedSectionHeadingIndex),
		`== ${githubRepositoryUrl}/compare/v${options.versionToRelease}\\...HEAD[Unreleased]`,
		"",
		(latestVersion !== null
			? `== ${githubRepositoryUrl}/compare/v${latestVersion}\\...`
			: `== ${githubRepositoryUrl}/releases/tag/`) +
			`v${options.versionToRelease}[${options.versionToRelease}] - ${options.releaseDate}`,
		...linesBetweenUnreleasedSectionHeadingAndNextSectionHeading,
		...(nextSectionHeadingIndex !== -1
			? lines.slice(nextSectionHeadingIndex)
			: []),
	]

	return {
		status: "succeeded",
		content: updatedLines.join("\n"),
	}
}

function isHeading(line: string): boolean {
	return line.startsWith("== ")
}

function getGithubRepositoryUrl(unreleasedDescription: string): string {
	if (unreleasedDescription.endsWith("\\...HEAD")) {
		return unreleasedDescription.substring(
			0,
			unreleasedDescription.lastIndexOf("/compare/v"),
		)
	}

	return unreleasedDescription
}

function getLatestVersion(latestRelease: string): string {
	const compareToIndex = latestRelease.lastIndexOf("\\...v")

	const versionIndex =
		compareToIndex !== -1
			? compareToIndex + "\\...v".length
			: latestRelease.lastIndexOf("/releases/tag/v") + "/releases/tag/v".length

	return latestRelease.substring(
		versionIndex,
		latestRelease.indexOf("[", versionIndex + "0.0.0".length),
	)
}
