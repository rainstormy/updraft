export function assertError(error: unknown): asserts error is Error {
	if (!(error instanceof Error)) {
		throw error
	}
}

export type ExitCode =
	| ExitCode.GeneralError
	| ExitCode.InvalidInput
	| ExitCode.Success

export namespace ExitCode {
	export type Success = 0
	export type GeneralError = 1
	export type InvalidInput = 2
}
