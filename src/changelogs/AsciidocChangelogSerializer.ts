import type { Changelog } from "+changelogs/Changelog"

export function serializeChangelogToAsciidoc(changelog: Changelog): string {
	return (
		changelog.preamble +
		changelog.sections.map(serializeSectionToAsciidoc).join("")
	)
}

function serializeSectionToAsciidoc(section: Changelog.Section): string {
	return `\n\n\n${serializeSectionHeadingToAsciidoc(
		section,
	)}${serializeSectionBodyToAsciidoc(section)}`
}

function serializeSectionHeadingToAsciidoc(section: Changelog.Section): string {
	if (section.repositoryUrl === null) {
		return section.release === null
			? "== Unreleased"
			: `== ${section.release.version} - ${section.release.date}`
	}

	if (section.release === null) {
		return `== ${section.repositoryUrl}${
			section.previousRelease === null
				? ""
				: `/compare/v${section.previousRelease.version}\\...HEAD`
		}[Unreleased]`
	}

	return `== ${section.repositoryUrl}${
		section.previousRelease === null
			? `/releases/tag/v${section.release.version}`
			: `/compare/v${section.previousRelease.version}\\...v${section.release.version}`
	}[${section.release.version}] - ${section.release.date}`
}

function serializeSectionBodyToAsciidoc(section: Changelog.Section): string {
	return section.sectionBody !== "" ? `\n\n${section.sectionBody}` : ""
}
