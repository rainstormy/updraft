export function isFulfilled<Value>(
	result: PromiseSettledResult<Value>,
): result is PromiseFulfilledResult<Value> {
	return result.status === "fulfilled"
}

export function isRejected(
	result: PromiseSettledResult<unknown>,
): result is PromiseRejectedResult {
	return result.status === "rejected"
}
