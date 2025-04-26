export function assertNotNullish<Value>(
	value: Value | null | undefined,
	name?: string,
): asserts value is Value {
	if (value === null || value === undefined) {
		throw new Error(
			name
				? `Expected '${name}' to be not-nullish, but it was ${value}`
				: `Expected a not-nullish value, but it was ${value}`,
		)
	}
}
