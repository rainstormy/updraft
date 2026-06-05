#!/usr/bin/env node

import process, { argv } from "node:process"
import { cliProgram } from "#program/cli/CliProgram.ts"
import type { ExitCode } from "#utilities/ExitCode.ts"

const exitCode: ExitCode = await cliProgram(argv.slice(2))
process.exit(exitCode)
