import {
	type DateString,
	type SemanticVersionString,
} from "+utilities/string-types"

export type Release = {
	readonly date: DateString
	readonly version: SemanticVersionString
}
