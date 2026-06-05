/**
 * CAUTION: `vitest.config.ts` references this file by its exact pathname `src/utilities/vitest/VitestSetup.mocks.ts`.
 */

import { mockFileSystem } from "#utilities/files/FileSystem.mocks.ts"
import { mockLogger } from "#utilities/logging/Logger.mocks.ts"
import { mockToday } from "#utilities/today/Today.mocks.ts"

mockFileSystem()
mockLogger()
mockToday("1970-01-01")
