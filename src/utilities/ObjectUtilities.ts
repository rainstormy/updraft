export function assertNotNullish(
	value: unknown,
): asserts value is NonNullable<typeof value> {
	if (value === null || value === undefined) {
		throw new Error(`Expected a non-nullish value, but got ${value}`)
	}
}
