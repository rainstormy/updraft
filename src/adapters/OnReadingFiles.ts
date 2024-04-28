import { readFile } from "node:fs/promises"
import { assertError } from "+utilities/ErrorUtilities"
import type { PathsWithContent } from "+utilities/FileUtilities"

export type OnReadingFiles = typeof onReadingFilesFromDisk

export async function onReadingFilesFromDisk(input: {
	paths: Array<string>
}): Promise<PathsWithContent> {
	const { paths } = input

	return Promise.all(
		paths.map(async (path) => {
			try {
				const content = await readFile(path, "utf8")
				return [path, content]
			} catch (error) {
				assertError(error)
				raiseError({ path, errorMessage: error.message })
			}
		}),
	)
}

/**
 * For unit testing purposes.
 */
export function onReadingFakeFiles(
	pathsWithContent: Array<
		[path: string, contentOrErrorMessage: string | (() => string)]
	>,
): OnReadingFiles {
	return async ({ paths }) =>
		pathsWithContent
			.filter(([path]) => paths.includes(path))
			.map(([path, content]) =>
				typeof content === "string"
					? [path, content]
					: raiseError({ path, errorMessage: content() }),
			)
}

function raiseError(input: {
	path: string
	errorMessage: string
}): never {
	const { path, errorMessage } = input
	throw new Error(`Failed to read ${path}: ${errorMessage}.`)
}
