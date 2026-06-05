export function assertError(error: unknown): asserts error is Error {
	if (!(error instanceof Error)) {
		throw error
	}
}

export function assertNotNullish<Value extends NonNullable<unknown>>(
	value: Value | null | undefined,
	name = "",
): asserts value is Value {
	if (value === null || value === undefined) {
		throw new Error(
			name
				? `Expected '${name}' to be not-nullish, but it was ${value}`
				: `Expected a not-nullish value, but it was ${value}`,
		)
	}
}
