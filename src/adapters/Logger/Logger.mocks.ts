import { vi } from "vitest"

vi.mock(import("#adapters/Logger/Logger.ts"), () => ({
	printMessage: vi.fn(),
	printWarning: vi.fn(),
	printError: vi.fn(),
}))

export function mockLogger(): void {
	// Do nothing, but importing this file triggers `vi.mock()` above as a side effect.
}
