export type OnDisplayingMessage = typeof onDisplayingMessageInConsole

export async function onDisplayingMessageInConsole(input: {
	readonly level: "info" | "error" | "warning"
	readonly message: string
}): Promise<void> {
	const { level, message } = input

	switch (level) {
		case "error":
			console.error(`ERROR: ${message}`)
			break
		case "info":
			console.log(message)
			break
		case "warning":
			console.warn(`WARNING: ${message}`)
			break
	}
}
