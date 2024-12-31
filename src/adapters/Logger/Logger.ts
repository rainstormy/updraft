export function printMessage(message: string): void {
	// biome-ignore lint/suspicious/noConsole: Using `console` is intentional in this case.
	console.log(message)
}

export function printWarning(message: string): void {
	// biome-ignore lint/suspicious/noConsole: Using `console` is intentional in this case.
	console.warn(`WARNING: ${message}`)
}

export function printError(message: string): void {
	// biome-ignore lint/suspicious/noConsole: Using `console` is intentional in this case.
	console.error(`ERROR: ${message}`)
}
