#!/usr/bin/env node

import process, { argv } from "node:process"
import { updraftCliProgram } from "#program/UpdraftCliProgram"
import type { ExitCode } from "#utilities/ErrorUtilities"

const exitCode: ExitCode = await updraftCliProgram(argv.slice(2))
process.exit(exitCode)
