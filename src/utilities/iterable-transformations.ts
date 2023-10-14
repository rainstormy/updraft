/**
 * A type-narrowing predicate for `Array.filter()` that checks if the given `element` is not null or undefined.
 *
 * As it accepts exactly one parameter, it is safe to use as a function reference: `filter(notNullish)`.
 * Hence, the `unicorn/no-array-callback-reference` linting rule can be safely ignored.
 */
export function notNullish<Element>(
	element: Element | null | undefined,
): element is Element {
	return element !== null && element !== undefined
}

/**
 * A type-narrowing predicate for `Array.filter()` that checks if the given `keyValuePair` has a value that is not null or undefined.
 *
 * As it accepts exactly one parameter, it is safe to use as a function reference: `filter(notNullishValue)`.
 * Hence, the `unicorn/no-array-callback-reference` linting rule can be safely ignored.
 */
export function notNullishValue<Key, Value>(
	/* eslint-disable functional/prefer-readonly-type -- Type narrowing does not work on elements of readonly tuples. */
	keyValuePair: [Key, Value | null | undefined],
): keyValuePair is [Key, Value] {
	/* eslint-enable functional/prefer-readonly-type */
	const [, value] = keyValuePair
	return value !== null && value !== undefined
}
