import { assertNotNullish } from "#utilities/Assertions"
import { checkSequentialRelease } from "#utilities/types/ComparableSemanticVersionString"
import type { Release } from "#utilities/types/Release"
import { extractSemanticVersionString } from "#utilities/types/SemanticVersionString"

// Matches the `version` field.
const versionFieldRegex = /"version":(?<whitespace>\s*)"(?<version>[^"]+)"/u

// Matches trailing newline characters.
const trailingNewlinesRegex = /\n*$/u

export async function promotePackageJson(
	originalContent: string,
	newRelease: Release,
): Promise<string> {
	const versionFieldMatch = versionFieldRegex.exec(originalContent)

	if (!versionFieldMatch?.groups) {
		throw new Error("must have a 'version' field")
	}

	const { version, whitespace } = versionFieldMatch.groups
	assertNotNullish(version, "version")
	assertNotNullish(whitespace, "whitespace")

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
