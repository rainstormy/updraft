export function dedent(
	stringSegments: TemplateStringsArray,
	...interpolatedValues: ReadonlyArray<unknown>
): string {
	const completeString = stringSegments
		.map((segment, index) => {
			if (index === interpolatedValues.length) {
				return segment
			}

			const indentBeforeInterpolation = extractIndent(lastLine(segment))
			const interpolationLines = `${interpolatedValues[index]}`.split("\n")

			return segment + interpolationLines.join("\n" + indentBeforeInterpolation)
		})
		.join("")

	const lines = completeString.split("\n")
	const commonIndent = commonIndentSize(lines)

	const dedentedLines = lines.map((line) => line.slice(commonIndent))
	return dedentedLines.join("\n").replace(/^\n+|\n+$/gu, "")
}

function lastLine(value: string): string {
	return value.slice(value.lastIndexOf("\n") + 1)
}

function commonIndentSize(lines: ReadonlyArray<string>): number {
	const indentSizes = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => extractIndent(line).length)
	return Math.min(...indentSizes)
}

function extractIndent(line: string): string {
	return line.match(/^[ \t]*/u)?.[0] ?? ""
}
