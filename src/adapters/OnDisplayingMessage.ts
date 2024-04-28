export type OnDisplayingMessage = typeof onDisplayingMessageInConsole

export namespace OnDisplayingMessage {
	export type Payload = Parameters<OnDisplayingMessage>[0]

	export type Severity = "info" | "warning" | "error"
}

export async function onDisplayingMessageInConsole(input: {
	severity: OnDisplayingMessage.Severity
	message: string
}): Promise<void> {
	const { severity, message } = input

	switch (severity) {
		case "info": {
			// biome-ignore lint/nursery/noConsole: Using `console` is intentional in this case.
			console.log(message)
			break
		}
		case "warning": {
			// biome-ignore lint/nursery/noConsole: Using `console` is intentional in this case.
			console.warn(`WARNING: ${message}`)
			break
		}
		case "error": {
			// biome-ignore lint/nursery/noConsole: Using `console` is intentional in this case.
			console.error(`ERROR: ${message}`)
			break
		}
	}
}
