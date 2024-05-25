import type { SemanticVersionString } from "+utilities/StringUtilities"
import { version } from "../../../package.json" assert { type: "json" }

export function packageJsonVersion(): SemanticVersionString {
	return version as SemanticVersionString
}
