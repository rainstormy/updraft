import type { DateString } from "#utilities/types/DateString.ts"
import type { SemanticVersionString } from "#utilities/types/SemanticVersionString.ts"

export type Release = {
	checks: Array<ReleaseCheck>
	date: DateString
	version: SemanticVersionString
}

export type ReleaseCheck = "sequential"
