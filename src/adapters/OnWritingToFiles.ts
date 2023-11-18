import { assertError } from "+utilities/assertions"
import { type PathsWithContent } from "+utilities/io-types"
import { writeFile } from "node:fs/promises"

export type OnWritingToFiles = typeof onWritingToFilesOnDisk

export async function onWritingToFilesOnDisk(input: {
	readonly outputPathsWithContent: PathsWithContent
}): Promise<void> {
	const { outputPathsWithContent } = input

	await Promise.all(
		outputPathsWithContent.map(async ([path, contents]) => {
			try {
				await writeFile(path, contents, "utf-8")
			} catch (error) {
				assertError(error)
				raiseError({ path, errorMessage: error.message })
			}
		}),
	)
}

export function fakeWritingToFiles(
	sabotagedPaths: ReadonlyArray<
		readonly [path: string, errorMessage: () => string]
	>,
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
	readonly path: string
	readonly errorMessage: string
}): never {
	const { path, errorMessage } = input
	throw new Error(`Failed to write changes to ${path}: ${errorMessage}.`)
}
