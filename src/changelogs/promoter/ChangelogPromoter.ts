import { type Changelog } from "+changelogs/Changelog"

export type ChangelogPromotion =
	| ChangelogPromotion.Succeeded
	| ChangelogPromotion.Failed

export namespace ChangelogPromotion {
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
): ChangelogPromotion {
	const unreleasedSection =
		changelog.sections.find((section) => section.release === null) ?? null

	if (unreleasedSection === null) {
		return failed("must have an 'Unreleased' section")
	}

	if (unreleasedSection.repositoryUrl === null) {
		return failed(
			"must have a link to the GitHub repository in the 'Unreleased' section",
		)
	}

	if (unreleasedSection.sectionBody === "") {
		return failed("must have at least one item in the 'Unreleased' section")
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

function failed(errorMessage: string): ChangelogPromotion.Failed {
	return { status: "failed", errorMessage }
}

function succeeded(promotedChangelog: Changelog): ChangelogPromotion.Succeeded {
	return { status: "succeeded", promotedChangelog }
}
