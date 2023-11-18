import { type Changelog } from "+changelogs/Changelog"
import { type Release } from "+utilities/Release"
import {
	type DateString,
	type SemanticVersionString,
} from "+utilities/string-types"

export function parseAsciidocChangelog(content: string): Changelog {
	const [preamble, ...rawSections] = content.split(/(?=^== .+)/mu)

	return {
		preamble: preamble.trim(),
		sections: withPreviousReleases(
			rawSections.map(toChangelogSectionWithoutPreviousRelease),
		),
	}
}

function toChangelogSectionWithoutPreviousRelease(
	sectionContent: string,
): Changelog.Section {
	const [heading, sectionBody] = getHeadingAndBody(sectionContent)

	return {
		repositoryUrl: getRepositoryUrl(heading),
		previousRelease: null,
		release: getRelease(heading) ?? null,
		sectionBody,
	}
}

function getHeadingAndBody(
	sectionContent: string,
): [heading: string, body: string] {
	const firstNewlineIndex = sectionContent.indexOf("\n")

	if (firstNewlineIndex >= 0) {
		return [
			sectionContent.substring("== ".length, firstNewlineIndex).trim(),
			sectionContent.substring(firstNewlineIndex + 1).trim(),
		]
	}

	return [sectionContent.substring("== ".length).trim(), ""]
}

function withPreviousReleases(
	sections: ReadonlyArray<Changelog.Section>,
): ReadonlyArray<Changelog.Section> {
	return sections.map((section, index) => ({
		...section,
		previousRelease: sections[index + 1]?.release ?? null,
	}))
}

function getRepositoryUrl(
	heading: string,
): Changelog.RepositoryUrlString | null {
	if (
		!heading.includes("https://") &&
		!heading.includes("{") &&
		!heading.includes("}")
	) {
		return null
	}

	if (heading.includes("/compare/")) {
		return heading.substring(
			0,
			heading.indexOf("/compare/"),
		) as Changelog.RepositoryUrlString
	}

	if (heading.includes("/releases/tag/")) {
		return heading.substring(
			0,
			heading.indexOf("/releases/tag/"),
		) as Changelog.RepositoryUrlString
	}

	const urlLabelStartIndex = heading.indexOf("[")
	return (
		urlLabelStartIndex >= 0 ? heading.substring(0, urlLabelStartIndex) : heading
	) as Changelog.RepositoryUrlString
}

function getRelease(heading: string): Release | null {
	if (!heading.includes("/compare/") && !heading.includes("/releases/tag/")) {
		return null
	}

	const urlLabelStartIndex = heading.indexOf("[")
	const urlLabelEndIndex = heading.indexOf("] - ", urlLabelStartIndex)

	if (urlLabelStartIndex === -1 || urlLabelEndIndex === -1) {
		return null
	}

	return {
		version: heading.substring(
			urlLabelStartIndex + 1,
			urlLabelEndIndex,
		) as SemanticVersionString,
		date: heading.substring(urlLabelEndIndex + "] - ".length) as DateString,
	}
}
