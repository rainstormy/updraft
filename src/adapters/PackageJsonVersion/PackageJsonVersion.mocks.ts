import { vi } from "vitest"
import type { ModuleMock } from "#utilities/ModuleMock.ts"

export type PackageJsonVersionMock = ModuleMock<
	typeof import("#adapters/PackageJsonVersion/PackageJsonVersion")
>

export function injectPackageJsonVersionMock(): PackageJsonVersionMock {
	const mock = vi.hoisted<PackageJsonVersionMock>(() => ({
		packageJsonVersion: vi.fn(),
	}))

	vi.mock("#adapters/PackageJsonVersion/PackageJsonVersion", () => mock)
	return mock
}
