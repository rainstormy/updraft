import process, { argv } from "node:process"
import { onDisplayingMessageInConsole } from "+adapters/OnDisplayingMessage"
import { onListingMatchingFilesFromDisk } from "+adapters/OnListingMatchingFiles"
import { onReadingFilesFromDisk } from "+adapters/OnReadingFiles"
import { onWritingToFilesOnDisk } from "+adapters/OnWritingToFiles"
import { mainProgram } from "+program/Program"
import type {
	DateString,
	SemanticVersionString,
} from "+utilities/StringUtilities"
import { version as packageJsonVersion } from "../package.json" assert {
	type: "json",
}

const today = new Date()
	.toISOString()
	.slice(0, "yyyy-mm-dd".length) as DateString

const toolVersion = packageJsonVersion as SemanticVersionString

mainProgram(
	{
		args: argv.slice(2),
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
