import { vi } from "vitest"
import type { DateString } from "#utilities/types/DateString.ts"

vi.mock(import("#adapters/Today/Today.ts"), () => ({
	today: vi.fn(() => mockedToday),
}))

let mockedToday: DateString

export function mockToday(today: DateString): void {
	mockedToday = today
}
