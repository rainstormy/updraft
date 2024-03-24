import fg from "fast-glob"

export type OnListingMatchingFiles = typeof onListingMatchingFilesFromDisk

export async function onListingMatchingFilesFromDisk(input: {
	filePatterns: Array<string>
}): Promise<Array<string>> {
	const { filePatterns } = input
	return fg.glob([...filePatterns], { dot: true })
}

/**
 * For unit testing purposes.
 */
export function onListingFakeMatchingFiles(
	paths: Array<string>,
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
