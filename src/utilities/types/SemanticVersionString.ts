import { isNonEmptyArray } from "#utilities/Arrays"
import { isSequentialUpgrade } from "#utilities/types/ComparableSemanticVersionString"

export type SemanticVersionString =
	| `${number}.${number}.${number}`
	| `${number}.${number}.${number}+${string}`
	| `${number}.${number}.${number}-${string}`
	| `${number}.${number}.${number}-${string}+${string}`

export const semanticVersionRegex =
	/(?<fullVersion>(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?<prerelease>-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?<build>\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?)/

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
	if (isNonEmptyArray(previousReleaseVersions)) {
		if (previousReleaseVersions.includes(releaseVersion)) {
			throw new Error(`already contains release version ${releaseVersion}`)
		}
		if (!isSequentialUpgrade(previousReleaseVersions[0], releaseVersion)) {
			throw new Error(
				`has latest release version ${previousReleaseVersions[0]}, but was set to update to ${releaseVersion}`,
			)
		}
	}
}
