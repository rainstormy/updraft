import type { Release } from "+utilities/types/Release"
import {
	checkSequentialRelease,
	extractSemanticVersionString,
} from "+utilities/types/SemanticVersionString"

// Matches the `version` field.
const versionFieldRegex = /"version":(?<whitespace>\s*)"(?<version>[^"]+)"/u

// Matches trailing newline characters.
const trailingNewlinesRegex = /\n*$/u

export async function promotePackageJson(
	originalContent: string,
	newRelease: Release,
): Promise<string> {
	const versionFieldMatch = versionFieldRegex.exec(originalContent)

	if (versionFieldMatch === null || versionFieldMatch.groups === undefined) {
		throw new Error("must have a 'version' field")
	}

	const { version, whitespace } = versionFieldMatch.groups

	if (newRelease.checks.includes("sequential")) {
		const existingVersion = extractSemanticVersionString(version)
		if (existingVersion !== null) {
			checkSequentialRelease(newRelease.version, [existingVersion])
		}
	}

	return (
		originalContent
			.replace(
				versionFieldRegex,
				`"version":${whitespace}"${newRelease.version}"`,
			)

			// Insert exactly one trailing newline character.
			.replace(trailingNewlinesRegex, "\n")
	)
}
