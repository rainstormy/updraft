export type NonEmptyArray<Item> = [Item, ...Array<Item>]

export function isNonEmptyArray<Item>(items: Array<Item>): items is NonEmptyArray<Item> {
	return items.length > 0
}

export function notNullish<Value>(value: Value | null | undefined): value is Value {
	return value !== null && value !== undefined
}

export function notFalse<Value>(value: Value | false): value is Value {
	return value !== false
}
