import { beforeEach, vi } from "vitest"
import type { Files } from "#adapters/FileSystem/File.ts"

vi.mock(import("#adapters/FileSystem/FileSystem.ts"), () => ({
	readMatchingFiles: vi.fn(async (): Promise<Files> => {
		if (mockedReadErrorMessage) {
			throw new Error(mockedReadErrorMessage)
		}
		return mockedFiles
	}),
	writeFiles: vi.fn(async (): Promise<void> => {
		if (mockedWriteErrorMessage) {
			throw new Error(mockedWriteErrorMessage)
		}
	}),
}))

let mockedFiles: Files
let mockedReadErrorMessage: string | null
let mockedWriteErrorMessage: string | null

export function mockFileSystem(): void {
	beforeEach(() => {
		mockedFiles = []
		mockedReadErrorMessage = null
		mockedWriteErrorMessage = null
	})
}

export function mockMatchingFiles(files: Files): void {
	mockedFiles = files
}

export function mockSabotagedMatchingFiles(errorMessage: string): void {
	mockedReadErrorMessage = errorMessage
}

export function mockSabotagedWriteFiles(errorMessage: string): void {
	mockedWriteErrorMessage = errorMessage
}
