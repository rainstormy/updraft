import type { SemanticVersionString } from "#utilities/types/SemanticVersionString.ts"
import { version } from "../../../package.json" with { type: "json" }

export function packageJsonVersion(): SemanticVersionString {
	return version as SemanticVersionString
}
