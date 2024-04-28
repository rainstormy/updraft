import type { Release } from "+utilities/Release"

const versionFieldRegex = /"version":\s*"(?<semanticVersionNumber>[^"]+)"/u

export async function promotePackage(input: {
	originalPackageContent: string
	newRelease: Release
}): Promise<string> {
	const { originalPackageContent, newRelease } = input

	const hasVersionField = versionFieldRegex.test(originalPackageContent)

	if (!hasVersionField) {
		throw new Error("must have a 'version' field")
	}

	return originalPackageContent.replace(
		versionFieldRegex,
		`"version": "${newRelease.version}"`,
	)
}
