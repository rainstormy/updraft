export type DateString = `${number}-${number}-${number}`

export type HyperlinkString = `https://${string}.${string}` | `/${string}`

export type SemanticVersionString =
	| `${number}.${number}.${number}`
	| `${number}.${number}.${number}-${string}`
