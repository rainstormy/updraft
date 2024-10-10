#!/usr/bin/env node

import process, { argv } from "node:process"
import { updraftCliProgram } from "../lib/index.js"

updraftCliProgram(argv.slice(2)).then(process.exit)
