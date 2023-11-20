import {
	type DateString,
	type SemanticVersionString,
} from "+utilities/StringUtilities"

export type Release = {
	readonly date: DateString
	readonly version: SemanticVersionString
}
