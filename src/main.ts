import process, { argv } from "node:process"
import { onDisplayingMessageInConsole } from "+adapters/OnDisplayingMessage"
import { onListingMatchingFilesFromDisk } from "+adapters/OnListingMatchingFiles"
import { onReadingFilesFromDisk } from "+adapters/OnReadingFiles"
import { onWritingToFilesOnDisk } from "+adapters/OnWritingToFiles"
import { mainProgram } from "+program/Program"

mainProgram(argv.slice(2), {
	onDisplayingMessage: onDisplayingMessageInConsole,
	onListingMatchingFiles: onListingMatchingFilesFromDisk,
	onReadingFiles: onReadingFilesFromDisk,
	onWritingToFiles: onWritingToFilesOnDisk,
}).then((exitCode) => process.exit(exitCode))
