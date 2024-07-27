#!/usr/bin/env node

import process, { argv } from "node:process"
import { updraftProgram } from "../dist/index.js"

updraftProgram(argv.slice(2)).then((exitCode) => process.exit(exitCode))
