export type MocksOf<
	Module extends Record<string, (...params: never) => unknown>,
> = {
	[Name in keyof Module & string as `mock${Capitalize<Name>}`]: (
		fakeValue: ReturnType<Module[Name]>,
	) => void
}
