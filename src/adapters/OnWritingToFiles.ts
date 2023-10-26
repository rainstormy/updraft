import type { PathsWithContent } from "+utilities"
import { writeFile } from "node:fs/promises"

export type OnWritingToFiles = typeof onWritingToFilesOnDisk

export namespace OnWritingToFiles {
	export type Result = Failed | Succeeded

	export type Failed = {
		readonly status: "failed"
		readonly errorMessage: string
	}

	export type Succeeded = {
		readonly status: "succeeded"
	}
}

export async function onWritingToFilesOnDisk(input: {
	readonly outputPathsWithContent: PathsWithContent
}): Promise<OnWritingToFiles.Result> {
	const { outputPathsWithContent } = input

	for (const [path, contents] of outputPathsWithContent) {
		try {
			await writeFile(path, contents, "utf-8")
		} catch (error) {
			return {
				status: "failed",
				errorMessage:
					error instanceof Error
						? `Cannot save changes to ${path}: ${error.message}`
						: `Cannot save changes to ${path}`,
			}
		}
	}
	return { status: "succeeded" }
}
