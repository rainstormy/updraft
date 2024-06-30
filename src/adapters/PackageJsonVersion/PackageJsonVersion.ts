import type { SemanticVersionString } from "+utilities/types/SemanticVersionString"
import { version } from "../../../package.json" assert { type: "json" }

export function packageJsonVersion(): SemanticVersionString {
	return version as SemanticVersionString
}
