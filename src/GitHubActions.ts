import process from "node:process"
import { getArgsFromActionInput } from "#adapters/ActionInput/ActionInput.ts"
import { updraftProgram } from "#program/UpdraftProgram.ts"
import type { ExitCode } from "#utilities/ErrorUtilities.ts"

const exitCode: ExitCode = await updraftProgram(getArgsFromActionInput())
process.exit(exitCode)
