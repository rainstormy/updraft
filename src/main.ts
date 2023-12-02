import { onDisplayingMessageInConsole } from "+adapters/OnDisplayingMessage"
import { onListingMatchingFilesFromDisk } from "+adapters/OnListingMatchingFiles"
import { onReadingFilesFromDisk } from "+adapters/OnReadingFiles"
import { onWritingToFilesOnDisk } from "+adapters/OnWritingToFiles"
import {
	type DateString,
	type SemanticVersionString,
} from "+utilities/StringUtilities"
import process, { argv } from "node:process"
import { version as packageJsonVersion } from "../package.json" assert { type: "json" }
import { getConfigurationFromArgs } from "./Configuration"
import { runProgram } from "./Program"

const today = new Date()
	.toISOString()
	.slice(0, "yyyy-mm-dd".length) as DateString

const toolVersion = packageJsonVersion as SemanticVersionString

runProgram(
	{
		configuration: getConfigurationFromArgs(argv.slice(2)),
		today,
		toolVersion,
	},
	{
		onDisplayingMessage: onDisplayingMessageInConsole,
		onListingMatchingFiles: onListingMatchingFilesFromDisk,
		onReadingFiles: onReadingFilesFromDisk,
		onWritingToFiles: onWritingToFilesOnDisk,
	},
).then((exitCode) => process.exit(exitCode))
