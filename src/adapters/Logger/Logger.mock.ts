import type { ModuleMock } from "+utilities/ModuleMock"
import { vi } from "vitest"

export type LoggerMock = ModuleMock<typeof import("+adapters/Logger/Logger")>

export function injectLoggerMock(): LoggerMock {
	const mock = vi.hoisted<LoggerMock>(() => ({
		printMessage: vi.fn(),
		printWarning: vi.fn(),
		printError: vi.fn(),
	}))

	vi.mock("+adapters/Logger/Logger", () => mock)
	return mock
}
