export function assumeNotNullish(
	value: unknown,
): asserts value is NonNullable<typeof value> {
	if (value === null || value === undefined) {
		throw new Error(`Assumed a non-nullish value, but got ${value}`)
	}
}
