export function notNullish<Value>(
	value: Value | null | undefined,
): value is Value {
	return value !== null && value !== undefined
}

export function notFalse<Value>(value: Value | false): value is Value {
	return value !== false
}
