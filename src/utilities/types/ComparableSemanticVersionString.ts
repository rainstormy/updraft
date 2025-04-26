import { assertNotNullish } from "+utilities/Assertions"
import {
	type SemanticVersionString,
	semanticVersionRegex,
} from "+utilities/types/SemanticVersionString"

export type ComparableSemanticVersionString = {
	major: number
	minor: number
	patch: number
	prerelease: {
		label: string
		delimiter: string
		increment: number | null
	}
	build: string
}

const incrementRegex = /[-.](?<increment>\d+)$/

export function toComparableSemanticVersionString(
	version: SemanticVersionString,
): ComparableSemanticVersionString {
	const versionMatch = semanticVersionRegex.exec(version)

	if (!versionMatch?.groups) {
		throw new Error(
			`Expected a semantic version string, but it was '${version}'`,
		)
	}

	const { major, minor, patch, prerelease, build } = versionMatch.groups
	assertNotNullish(major, "major")
	assertNotNullish(minor, "minor")
	assertNotNullish(patch, "patch")

	const incrementMatch =
		prerelease !== undefined ? incrementRegex.exec(prerelease) : null

	const increment = incrementMatch?.groups?.increment ?? null

	return {
		major: Number.parseInt(major),
		minor: Number.parseInt(minor),
		patch: Number.parseInt(patch),
		prerelease: {
			label:
				prerelease !== undefined
					? increment !== null
						? prerelease.slice(0, -increment.length - 1)
						: prerelease
					: "",
			delimiter:
				prerelease !== undefined && increment !== null
					? prerelease.slice(-increment.length - 1, -increment.length)
					: "",
			increment: increment !== null ? Number.parseInt(increment) : null,
		},
		build: build ?? "",
	}
}

export function isSequentialUpgrade(
	currentVersion: SemanticVersionString,
	nextVersion: SemanticVersionString,
): boolean {
	const current = toComparableSemanticVersionString(currentVersion)
	const next = toComparableSemanticVersionString(nextVersion)

	return (
		(next.major === current.major + 1 && isInitialMinor(next)) ||
		(next.major === current.major && isSequentialMinor(current, next))
	)
}

function isInitialMinor(version: ComparableSemanticVersionString): boolean {
	return version.minor === 0 && isInitialPatch(version)
}

function isSequentialMinor(
	current: ComparableSemanticVersionString,
	next: ComparableSemanticVersionString,
): boolean {
	return (
		(next.minor === current.minor + 1 && isInitialPatch(next)) ||
		(next.minor === current.minor && isSequentialPatch(current, next))
	)
}

function isInitialPatch(version: ComparableSemanticVersionString): boolean {
	return version.patch === 0 && isInitialPrerelease(version)
}

function isSequentialPatch(
	current: ComparableSemanticVersionString,
	next: ComparableSemanticVersionString,
): boolean {
	return (
		(next.patch === current.patch + 1 &&
			!isPrerelease(current) &&
			isInitialPrerelease(next)) ||
		(next.patch === current.patch && isSequentialPrerelease(current, next))
	)
}

function isPrerelease(version: ComparableSemanticVersionString): boolean {
	return version.prerelease.label !== "" || version.build !== ""
}

function isInitialPrerelease(
	version: ComparableSemanticVersionString,
): boolean {
	return (
		version.prerelease.increment === null || version.prerelease.increment === 0
	)
}

function isSequentialPrerelease(
	current: ComparableSemanticVersionString,
	next: ComparableSemanticVersionString,
): boolean {
	if (current.prerelease.label === "") {
		return next.prerelease.label === "" && isSequentialBuild(current, next)
	}
	if (next.prerelease.label !== current.prerelease.label) {
		return isInitialPrerelease(next)
	}
	if (current.prerelease.increment === null) {
		return (
			next.prerelease.increment === 0 ||
			(next.prerelease.increment === null && isSequentialBuild(current, next))
		)
	}
	return (
		next.prerelease.increment === null ||
		(next.prerelease.delimiter === current.prerelease.delimiter &&
			(next.prerelease.increment === current.prerelease.increment + 1 ||
				(next.prerelease.increment === current.prerelease.increment &&
					isSequentialBuild(current, next))))
	)
}

function isSequentialBuild(
	current: ComparableSemanticVersionString,
	next: ComparableSemanticVersionString,
): boolean {
	return current.build !== "" && next.build !== current.build
}
