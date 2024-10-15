import process from "node:process"
import { getArgsFromActionInput } from "+adapters/ActionInput/ActionInput"
import { updraftProgram } from "+program/UpdraftProgram"

updraftProgram(getArgsFromActionInput()).then(process.exit)
