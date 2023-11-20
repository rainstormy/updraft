import fg from "fast-glob"

export type OnListingMatchingFiles = typeof onListingMatchingFilesFromDisk

export async function onListingMatchingFilesFromDisk(input: {
	readonly filePatterns: ReadonlyArray<string>
}): Promise<ReadonlyArray<string>> {
	const { filePatterns } = input
	return await fg.glob([...filePatterns], { dot: true })
}

/**
 * For unit testing purposes.
 */
export function onListingFakeMatchingFiles(
	paths: ReadonlyArray<string>,
): OnListingMatchingFiles {
	return async ({ filePatterns }) => {
		const regexes = filePatterns.map(convertGlobPatternToRegex)
		return paths.filter((path) => regexes.some((regex) => path.match(regex)))
	}
}

function convertGlobPatternToRegex(globPattern: string): string {
	return `^${globPattern
		.replaceAll(".", "\\.")
		.replaceAll("?", "[^/]")
		.replaceAll("**/", "(.+/)?")
		.replaceAll("*", "[^/]*")}$`
}
