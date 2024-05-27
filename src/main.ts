import process, { argv } from "node:process"
import { mainProgram } from "+program/Program"

mainProgram(argv.slice(2)).then((exitCode) => process.exit(exitCode))
