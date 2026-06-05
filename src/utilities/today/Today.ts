import type { DateString } from "#types/DateString.ts"

export function today(): DateString {
	return new Date().toISOString().slice(0, "yyyy-mm-dd".length) as DateString
}
