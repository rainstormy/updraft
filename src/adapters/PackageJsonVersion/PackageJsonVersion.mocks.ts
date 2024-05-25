import type { MocksOf } from "+utilities/TestUtilities"
import { vi } from "vitest"

type Module = typeof import("+adapters/PackageJsonVersion/PackageJsonVersion")

export function injectMocksOfPackageJsonVersion(): MocksOf<Module> {
	const mocks = vi.hoisted(() => {
		return {
			packageJsonVersion: vi.fn(),
		} satisfies Module
	})

	vi.mock("+adapters/PackageJsonVersion/PackageJsonVersion", () => mocks)

	return {
		mockPackageJsonVersion: (version) => {
			mocks.packageJsonVersion.mockReturnValue(version)
		},
	}
}
