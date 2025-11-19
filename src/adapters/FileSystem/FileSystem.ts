import { readFile, writeFile } from "node:fs/promises"
import fg from "fast-glob"
import type { File, Files } from "#adapters/FileSystem/File.ts"
import { assertError } from "#utilities/ErrorUtilities.ts"

export async function readMatchingFiles(
	filePatterns: Array<string>,
): Promise<Files> {
	const paths = await fg.glob([...filePatterns], { dot: true })
	return Promise.all(
		paths.map(async (path): Promise<File> => {
			try {
				const content = await readFile(path, "utf8")
				return { content, path }
			} catch (error) {
				assertError(error)
				throw new Error(`Failed to read ${path}: ${error.message}.`)
			}
		}),
	)
}

export async function writeFiles(files: Files): Promise<void> {
	await Promise.all(
		files.map(async ({ path, content }) => {
			try {
				await writeFile(path, content, "utf8")
			} catch (error) {
				assertError(error)
				throw new Error(`Failed to write changes to ${path}: ${error.message}.`)
			}
		}),
	)
}
