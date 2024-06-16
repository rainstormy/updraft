import type { Release } from "+utilities/Release"

const versionFieldRegex = /"version":\s*"(?<semanticVersionNumber>[^"]+)"/u

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
			.replace(/\n*$/u, "\n")
	)
}
