import { vi } from "vitest"
import type { UpdraftVersion } from "#utilities/version/UpdraftVersion.ts"

export function mockUpdraftVersion(version: UpdraftVersion): void {
	vi.stubEnv("UPDRAFT_VERSION", version)
}
