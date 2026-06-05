import type { DateString } from "#types/DateString.ts"
import type { SemanticVersionString } from "#types/SemanticVersionString.ts"

export type Release = {
	checks: Array<ReleaseCheck>
	date: DateString
	version: SemanticVersionString
}

export type ReleaseCheck = "sequential"
