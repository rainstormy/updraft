import type { SemanticVersionString } from "#utilities/types/SemanticVersionString"
import { version } from "../../../package.json" with { type: "json" }

export function packageJsonVersion(): SemanticVersionString {
	return version as SemanticVersionString
}
