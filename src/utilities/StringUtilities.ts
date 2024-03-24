export type DateString =
	`${DateString.Year}-${DateString.Month}-${DateString.Day}`

export namespace DateString {
	export type Year = `${number}${number}${number}${number}`
	export type Month = `${number}${number}`
	export type Day = `${number}${number}`
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

const leadingAndTrailingLinesRegex = /^\n+|\n+$/gu

export function dedent(
	stringSegments: TemplateStringsArray,
	...interpolatedValues: Array<string>
): string {
	const completeString = stringSegments
		.map((segment, index) => {
			if (index === interpolatedValues.length) {
				return segment
			}

			const indentBeforeInterpolation = extractIndent(lastLine(segment))
			const interpolationLines = interpolatedValues[index].split("\n")

			return segment + interpolationLines.join(`\n${indentBeforeInterpolation}`)
		})
		.join("")

	const lines = completeString.split("\n")
	const commonIndent = commonIndentSize(lines)

	const dedentedLines = lines.map((line) => line.slice(commonIndent))
	return dedentedLines.join("\n").replace(leadingAndTrailingLinesRegex, "")
}

function lastLine(value: string): string {
	return value.slice(value.lastIndexOf("\n") + 1)
}

function commonIndentSize(lines: Array<string>): number {
	const indentSizes = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => extractIndent(line).length)
	return Math.min(...indentSizes)
}

const indentRegex = /^[ \t]*/u

function extractIndent(line: string): string {
	return indentRegex.exec(line)?.[0] ?? ""
}
