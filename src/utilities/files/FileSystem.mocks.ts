import { beforeEach, vi } from "vitest"
import type { Files } from "#utilities/files/File.ts"

vi.mock(import("#utilities/files/FileSystem.ts"), () => ({
	readMatchingFiles: vi.fn(async (): Promise<Files> => {
		if (mockedReadErrorMessage !== null) {
			throw new Error(mockedReadErrorMessage)
		}
		return mockedFiles
	}),
	writeFiles: vi.fn(async (): Promise<void> => {
		if (mockedWriteErrorMessage !== null) {
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
