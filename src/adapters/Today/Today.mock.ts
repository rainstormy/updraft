import type { ModuleMock } from "+utilities/ModuleMock"
import { vi } from "vitest"

export type TodayMock = ModuleMock<typeof import("+adapters/Today/Today")>

export function injectTodayMock(): TodayMock {
	const mock = vi.hoisted<TodayMock>(() => ({
		today: vi.fn(),
	}))

	vi.mock("+adapters/Today/Today", () => mock)
	return mock
}
