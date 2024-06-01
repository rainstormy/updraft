import type { Changelog } from "+promoters/PromoteAsciidocChangelog/Changelog"
import type { Release } from "+utilities/Release"

export async function promoteChangelog(
	originalChangelog: Changelog,
	newRelease: Release,
): Promise<Changelog> {
	const unreleasedSection =
		originalChangelog.sections.find((section) => section.release === null) ??
		null

	if (unreleasedSection === null) {
		throw new Error("must have an 'Unreleased' section")
	}
	if (unreleasedSection.repositoryUrl === null) {
		throw new Error(
			"must have a link to the GitHub repository in the 'Unreleased' section",
		)
	}
	if (unreleasedSection.sectionBody === "") {
		throw new Error("must have at least one item in the 'Unreleased' section")
	}

	const releasedSections = originalChangelog.sections.filter(
		(section) => section.release !== null,
	)

	return {
		...originalChangelog,
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
	}
}
