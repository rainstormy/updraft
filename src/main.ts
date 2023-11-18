import { onDisplayingMessageInConsole } from "+adapters/OnDisplayingMessage"
import { onReadingMatchingFilesFromDisk } from "+adapters/OnReadingMatchingFiles"
import { onWritingToFilesOnDisk } from "+adapters/OnWritingToFiles"
import {
	type DateString,
	type SemanticVersionString,
} from "+utilities/string-types"
import { argv } from "node:process"
import { version as toolVersion } from "../package.json" assert { type: "json" }
import { getConfigurationFromArgs } from "./Configuration"
import { runProgram } from "./Program"

runProgram(
	{
		configuration: getConfigurationFromArgs({
			args: argv.slice(2),
			today: new Date().toISOString().slice(0, 10) as DateString,
			toolVersion: toolVersion as SemanticVersionString,
		}),
	},
	{
		onDisplayingMessage: onDisplayingMessageInConsole,
		onReadingMatchingFiles: onReadingMatchingFilesFromDisk,
		onWritingToFiles: onWritingToFilesOnDisk,
	},
).catch((error) => {
	console.error(error)
})
