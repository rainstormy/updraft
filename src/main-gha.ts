import process from "node:process"
import { getArgsFromActionInput } from "#adapters/ActionInput/ActionInput.ts"
import { program } from "#program/Program.ts"
import type { ExitCode } from "#utilities/ExitCode.ts"

const exitCode: ExitCode = await program(getArgsFromActionInput())
process.exit(exitCode)
