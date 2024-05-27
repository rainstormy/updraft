import { readFile, writeFile } from "node:fs/promises"
import type { File, Files } from "+adapters/FileSystem/File"
import { assertError } from "+utilities/ErrorUtilities"
import fg from "fast-glob"

export async function readMatchingFiles(
	filePatterns: Array<string>,
): Promise<Files> {
	const paths = await fg.glob([...filePatterns], { dot: true })
	return Promise.all(
		paths.map(async (path): Promise<File> => {
			try {
				const content = await readFile(path, "utf8")
				return { content, path, type: detectFileClass(path) }
			} catch (error) {
				assertError(error)
				throw new Error(`Failed to read ${path}: ${error.message}.`)
			}
		}),
	)
}

function detectFileClass(path: string): File.Type {
	const filename = path.split("/").at(-1) ?? ""

	if (filename === "package.json") {
		return "package-json"
	}
	if (filename.endsWith(".adoc")) {
		return "asciidoc-changelog"
	}
	throw new Error(`${path} is not a supported file format.`)
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
