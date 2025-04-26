export type NonEmptyArray<Item> = [Item, ...Array<Item>]

export function isNonEmptyArray<Item>(
	items: Array<Item>,
): items is NonEmptyArray<Item> {
	return items.length > 0
}
