/**
 * CAUTION: `vitest.config.ts` references this file by its exact pathname `src/utilities/vitest/VitestSetup.fakes.ts`.
 */

import { mockFileSystem } from "#utilities/files/FileSystem.fakes.ts"
import { mockLogger } from "#utilities/logging/Logger.fakes.ts"
import { mockToday } from "#utilities/today/Today.fakes.ts"

mockFileSystem()
mockLogger()
mockToday("1970-01-01")
