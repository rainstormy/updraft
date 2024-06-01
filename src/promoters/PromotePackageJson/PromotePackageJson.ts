import type { Release } from "+utilities/Release"
import { ensureTrailingNewlineIfNonEmpty } from "+utilities/StringUtilities"

const versionFieldRegex = /"version":\s*"(?<semanticVersionNumber>[^"]+)"/u

export async function promotePackageJson(
	originalContent: string,
	newRelease: Release,
): Promise<string> {
	const hasVersionField = versionFieldRegex.test(originalContent)

	if (!hasVersionField) {
		throw new Error("must have a 'version' field")
	}

	return ensureTrailingNewlineIfNonEmpty(
		originalContent.replace(
			versionFieldRegex,
			`"version": "${newRelease.version}"`,
		),
	)
}
