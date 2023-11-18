import { assertError } from "+utilities/assertions"
import { type PathsWithContent } from "+utilities/io-types"
import { glob } from "fast-glob"
import { readFile } from "node:fs/promises"

export type OnReadingMatchingFiles = typeof onReadingMatchingFilesFromDisk

export async function onReadingMatchingFilesFromDisk(input: {
	readonly globPatterns: ReadonlyArray<string>
}): Promise<PathsWithContent> {
	const { globPatterns } = input

	const matchingPaths = await glob([...globPatterns], { dot: true })

	return Promise.all(
		matchingPaths.map(async (path) => {
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

export function fakeReadingMatchingFiles(
	pathsWithContent: ReadonlyArray<
		readonly [path: string, contentOrErrorMessage: string | (() => string)]
	>,
): OnReadingMatchingFiles {
	return async ({ globPatterns }) =>
		pathsWithContent
			.filter(([path]) => globPatterns.includes(path))
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
