export function notNullish<Value>(
	value: Value | null | undefined,
): value is Value {
	return value !== null && value !== undefined
}
