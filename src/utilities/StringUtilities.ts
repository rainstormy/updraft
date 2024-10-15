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

export function pluralise(
	subject: number,
	singular: string,
	plural = `${singular}s`,
): string {
	return subject === 1 ? singular : plural
}

const byWhitespace = /\s+/

export function toStringArray(input: string): Array<string> {
	return input
		.split(byWhitespace)
		.map((element) => element.trim())
		.filter((element) => element.length > 0)
}
