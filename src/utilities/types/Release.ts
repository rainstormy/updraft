import type { DateString } from "+utilities/types/DateString"
import type { SemanticVersionString } from "+utilities/types/SemanticVersionString"

export type Release = {
	date: DateString
	version: SemanticVersionString
}
