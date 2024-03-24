import { writeFile } from "node:fs/promises"
import { assertError } from "+utilities/ErrorUtilities"
import type { PathsWithContent } from "+utilities/FileUtilities"

export type OnWritingToFiles = typeof onWritingToFilesOnDisk

export async function onWritingToFilesOnDisk(input: {
	outputPathsWithContent: PathsWithContent
}): Promise<void> {
	const { outputPathsWithContent } = input

	await Promise.all(
		outputPathsWithContent.map(async ([path, contents]) => {
			try {
				await writeFile(path, contents, "utf8")
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
export function onWritingToFakeFiles(
	sabotagedPaths: Array<[path: string, errorMessage: () => string]>,
): OnWritingToFiles {
	return async ({ outputPathsWithContent }) => {
		const sabotagedPath = sabotagedPaths.find(([path]) =>
			outputPathsWithContent.some(([outputPath]) => outputPath === path),
		)

		if (sabotagedPath !== undefined) {
			const [path, errorMessage] = sabotagedPath
			raiseError({ path, errorMessage: errorMessage() })
		}
	}
}

function raiseError(input: {
	path: string
	errorMessage: string
}): never {
	const { path, errorMessage } = input
	throw new Error(`Failed to write changes to ${path}: ${errorMessage}.`)
}
