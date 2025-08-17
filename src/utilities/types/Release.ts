import type { DateString } from "#utilities/types/DateString"
import type { SemanticVersionString } from "#utilities/types/SemanticVersionString"

export type Release = {
	checks: Array<ReleaseCheck>
	date: DateString
	version: SemanticVersionString
}

export type ReleaseCheck = "sequential"
