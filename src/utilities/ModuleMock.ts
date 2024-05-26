import type { Mock } from "vitest"

export type ModuleMock<
	Module extends Record<string, (...params: never) => unknown>,
> = {
	[Name in keyof Module]: Mock<
		Parameters<Module[Name]>,
		ReturnType<Module[Name]>
	>
}
