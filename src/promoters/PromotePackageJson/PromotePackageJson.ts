import type { Release } from "+utilities/Release"

// Matches the `version` field.
const versionFieldRegex = /"version":\s*"(?<semanticVersionNumber>[^"]+)"/u

// Matches trailing newline characters.
const trailingNewlinesRegex = /\n*$/u

export async function promotePackageJson(
	originalContent: string,
	newRelease: Release,
): Promise<string> {
	const hasVersionField = versionFieldRegex.test(originalContent)

	if (!hasVersionField) {
		throw new Error("must have a 'version' field")
	}

	return (
		originalContent
			.replace(versionFieldRegex, `"version": "${newRelease.version}"`)

			// Insert exactly one trailing newline character.
			.replace(trailingNewlinesRegex, "\n")
	)
}
