export function assertError(error: unknown): asserts error is Error {
	if (!(error instanceof Error)) {
		throw error
	}
}

export type ExitCode =
	| 0 // Success.
	| 1 // General error.
	| 2 // Invalid input.
