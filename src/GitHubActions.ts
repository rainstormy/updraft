import process from "node:process"
import { getArgsFromActionInput } from "#adapters/ActionInput/ActionInput"
import { updraftProgram } from "#program/UpdraftProgram"
import type { ExitCode } from "#utilities/ErrorUtilities"

const exitCode: ExitCode = await updraftProgram(getArgsFromActionInput())
process.exit(exitCode)
