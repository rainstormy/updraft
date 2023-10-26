export type DateString =
	`${DateString.Year}-${DateString.Month}-${DateString.Day}`

export namespace DateString {
	export type Year = `${number}${number}${number}${number}`
	export type Month = `${number}${number}`
	export type Day = `${number}${number}`
}

const iso8601DateRegex = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/

export function isDateString(value: string): value is DateString {
	return iso8601DateRegex.test(value)
}

export type HyperlinkString = `https://${string}.${string}` | `/${string}`

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
	/^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<prerelease>-[-\w]+(\.[-\w]+)*)?(?<build>\+[-\w]+(\.[-\w]+)*)?$/

export function isSemanticVersionString(
	value: string,
): value is SemanticVersionString {
	return semanticVersionNumberRegex.test(value)
}
