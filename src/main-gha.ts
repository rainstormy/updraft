import process from "node:process"
import { program } from "#program/Program.ts"
import type { ExitCode } from "#utilities/ExitCode.ts"
import { argsFromGithubActionInput } from "#utilities/github/GithubActionInput.ts"

const exitCode: ExitCode = await program(argsFromGithubActionInput())
process.exit(exitCode)
