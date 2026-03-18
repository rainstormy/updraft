/**
 * CAUTION: `vitest.config.ts` references this file by its exact pathname `src/utilities/vitest/VitestSetup.mocks.ts`.
 */

import { mockFileSystem } from "#adapters/FileSystem/FileSystem.mocks.ts"
import { mockLogger } from "#adapters/Logger/Logger.mocks.ts"
import { mockToday } from "#adapters/Today/Today.mocks.ts"

mockFileSystem()
mockLogger()
mockToday("1970-01-01")
