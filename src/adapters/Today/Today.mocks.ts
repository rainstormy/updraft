import type { MocksOf } from "+utilities/TestUtilities"
import { vi } from "vitest"

type Module = typeof import("+adapters/Today/Today")

export function injectMocksOfToday(): MocksOf<Module> {
	const mocks = vi.hoisted(() => {
		return {
			today: vi.fn(),
		} satisfies Module
	})

	vi.mock("+adapters/Today/Today", () => mocks)

	return {
		mockToday: (dateString) => {
			mocks.today.mockReturnValue(dateString)
		},
	}
}
