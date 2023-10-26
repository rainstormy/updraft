import type { PathsWithContent, PathWithContent } from "+utilities"
import { glob } from "fast-glob"
import { readFile } from "node:fs/promises"

export type OnReadingMatchingFiles = typeof onReadingMatchingFilesFromDisk

export namespace OnReadingMatchingFiles {
	export type Result = Failed | Succeeded

	export type Failed = {
		readonly status: "failed"
		readonly errorMessage: string
	}

	export type Succeeded = {
		readonly status: "succeeded"
		readonly pathsWithContent: PathsWithContent
	}
}

export async function onReadingMatchingFilesFromDisk(input: {
	readonly globPatterns: ReadonlyArray<string>
}): Promise<OnReadingMatchingFiles.Result> {
	const { globPatterns } = input

	if (globPatterns.length === 0) {
		return { status: "succeeded", pathsWithContent: [] }
	}

	const matchingPaths = await glob([...globPatterns], { dot: true })
	const pathsWithContent: Array<PathWithContent> = []

	for (const path of matchingPaths) {
		try {
			const contents = await readFile(path, "utf-8")
			pathsWithContent.push([path, contents])
		} catch (error) {
			return {
				status: "failed",
				errorMessage:
					error instanceof Error
						? `Cannot read ${path}: ${error.message}`
						: `Cannot read ${path}`,
			}
		}
	}

	return { status: "succeeded", pathsWithContent }
}
