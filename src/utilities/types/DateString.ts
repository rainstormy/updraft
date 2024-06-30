export type DateString =
	`${DateString.Year}-${DateString.Month}-${DateString.Day}`

export namespace DateString {
	export type Year = `${number}${number}${number}${number}`
	export type Month = `${number}${number}`
	export type Day = `${number}${number}`
}
