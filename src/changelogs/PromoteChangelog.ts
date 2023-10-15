import type { Changelog } from "+changelogs"

export type PromoteChangelogResult =
	| PromoteChangelogResult.Succeeded
	| PromoteChangelogResult.Failed

export namespace PromoteChangelogResult {
	export type Succeeded = {
		readonly status: "succeeded"
		readonly promotedChangelog: Changelog
	}

	export type Failed = {
		readonly status: "failed"
		readonly errorMessage: string
	}
}

export function promoteChangelog(
	changelog: Changelog,
	newRelease: Changelog.Release,
): PromoteChangelogResult {
	const unreleasedSection =
		changelog.sections.find((section) => section.release === null) ?? null

	if (unreleasedSection === null) {
		return failed("The changelog must have an 'Unreleased' section")
	}

	if (unreleasedSection.repositoryUrl === null) {
		return failed(
			"The 'Unreleased' section in the changelog must include a link to the GitHub repository",
		)
	}

	if (unreleasedSection.sectionBody === "") {
		return failed(
			"The 'Unreleased' section in the changelog must contain at least one item",
		)
	}

	const releasedSections = changelog.sections.filter(
		(section) => section.release !== null,
	)

	return succeeded({
		...changelog,
		sections: [
			{
				repositoryUrl: unreleasedSection.repositoryUrl,
				previousRelease: newRelease,
				release: null,
				sectionBody: "",
			},
			{
				repositoryUrl: unreleasedSection.repositoryUrl,
				previousRelease: releasedSections[0]?.release ?? null,
				release: newRelease,
				sectionBody: unreleasedSection.sectionBody,
			},
			...releasedSections,
		],
	})
}

function failed(errorMessage: string): PromoteChangelogResult.Failed {
	return {
		status: "failed",
		errorMessage: errorMessage,
	}
}

function succeeded(
	promotedChangelog: Changelog,
): PromoteChangelogResult.Succeeded {
	return {
		status: "succeeded",
		promotedChangelog,
	}
}
