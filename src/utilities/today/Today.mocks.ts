import { vi } from "vitest"
import type { DateString } from "#types/DateString.ts"

vi.mock(import("#utilities/today/Today.ts"), () => ({
	today: vi.fn(() => mockedToday),
}))

let mockedToday: DateString

export function mockToday(today: DateString): void {
	mockedToday = today
}
