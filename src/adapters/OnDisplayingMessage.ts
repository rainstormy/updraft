export type OnDisplayingMessage = typeof onDisplayingMessageInConsole

export namespace OnDisplayingMessage {
	export type Severity = "info" | "error" | "warning"
}

export async function onDisplayingMessageInConsole(input: {
	readonly severity: OnDisplayingMessage.Severity
	readonly message: string
}): Promise<void> {
	const { severity, message } = input

	switch (severity) {
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
