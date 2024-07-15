import { isSequentialUpgrade } from "+utilities/types/ComparableSemanticVersionString"

export type SemanticVersionString =
	| `${SemanticVersionString.MajorMinorPatch}`
	| `${SemanticVersionString.MajorMinorPatch}${SemanticVersionString.Build}`
	| `${SemanticVersionString.MajorMinorPatch}${SemanticVersionString.Prerelease}`
	| `${SemanticVersionString.MajorMinorPatch}${SemanticVersionString.Prerelease}${SemanticVersionString.Build}`

export namespace SemanticVersionString {
	export type MajorMinorPatch = `${number}.${number}.${number}`
	export type Prerelease = `-${string}`
	export type Build = `+${string}`
}

export const semanticVersionRegex =
	/(?<fullVersion>(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<prerelease>-[-\w]+(\.[-\w]+)*)?(?<build>\+[-\w]+(\.[-\w]+)*)?)/

export function extractSemanticVersionString(
	input: string,
): SemanticVersionString | null {
	const versionMatch = semanticVersionRegex.exec(input)
	return (versionMatch?.groups?.fullVersion as SemanticVersionString) ?? null
}

export function isPrerelease(version: SemanticVersionString): boolean {
	return version.includes("-") || version.includes("+")
}

export function checkSequentialRelease(
	releaseVersion: SemanticVersionString,
	previousReleaseVersions: Array<SemanticVersionString>,
): void {
	if (previousReleaseVersions.length === 0) {
		return
	}
	if (previousReleaseVersions.includes(releaseVersion)) {
		throw new Error(`already contains release version ${releaseVersion}`)
	}
	if (!isSequentialUpgrade(previousReleaseVersions[0], releaseVersion)) {
		throw new Error(
			`has latest release version ${previousReleaseVersions[0]}, but was set to update to ${releaseVersion}`,
		)
	}
}
