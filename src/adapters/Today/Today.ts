import type { DateString } from "#utilities/types/DateString"

export function today(): DateString {
	return new Date().toISOString().slice(0, "yyyy-mm-dd".length) as DateString
}
