import type { ModuleMock } from "+utilities/ModuleMock"
import { vi } from "vitest"

export type FileSystemMock = ModuleMock<
	typeof import("+adapters/FileSystem/FileSystem")
>

export function injectFileSystemMock(): FileSystemMock {
	const mock = vi.hoisted<FileSystemMock>(() => ({
		readMatchingFiles: vi.fn(),
		writeFiles: vi.fn(),
	}))

	vi.mock("+adapters/FileSystem/FileSystem", () => mock)
	return mock
}
