import { assertError } from "+utilities/ErrorUtilities"
import { type PathsWithContent } from "+utilities/FileUtilities"
import { readFile } from "node:fs/promises"

export type OnReadingFiles = typeof onReadingFilesFromDisk

export async function onReadingFilesFromDisk(input: {
	readonly paths: ReadonlyArray<string>
}): Promise<PathsWithContent> {
	const { paths } = input

	return Promise.all(
		paths.map(async (path) => {
			try {
				const content = await readFile(path, "utf-8")
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
	pathsWithContent: ReadonlyArray<
		readonly [path: string, contentOrErrorMessage: string | (() => string)]
	>,
): OnReadingFiles {
	return async ({ paths }) =>
		pathsWithContent
			.filter(([path]) => paths.includes(path))
			.map(([path, content]) => {
				if (typeof content === "string") {
					return [path, content]
				}
				raiseError({ path, errorMessage: content() })
			})
}

function raiseError(input: {
	readonly path: string
	readonly errorMessage: string
}): never {
	const { path, errorMessage } = input
	throw new Error(`Failed to read ${path}: ${errorMessage}.`)
}
