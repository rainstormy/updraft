import type {
	DateString,
	SemanticVersionString,
} from "+utilities/StringUtilities"

export type Release = {
	date: DateString
	version: SemanticVersionString
}
