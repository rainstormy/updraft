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

const semanticVersionNumberRegex =
	/(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<prerelease>-[-\w]+(\.[-\w]+)*)?(?<build>\+[-\w]+(\.[-\w]+)*)?/

export function extractSemanticVersionString(
	input: string,
): SemanticVersionString | null {
	const result = semanticVersionNumberRegex.exec(input)

	if (result === null || result.groups === undefined) {
		return null
	}

	const major = result.groups.major
	const minor = result.groups.minor
	const patch = result.groups.patch
	const prerelease = result.groups.prerelease ?? ""
	const build = result.groups.build ?? ""

	return `${major}.${minor}.${patch}${prerelease}${build}` as SemanticVersionString
}

export function isPrerelease(version: SemanticVersionString): boolean {
	return version.includes("-") || version.includes("+")
}
