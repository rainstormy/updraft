import { notNullish } from "#utilities/Arrays.ts"
import type { File, Files } from "#utilities/files/File.ts"

export type PromotableFile = File & {
	type: PromotableFilename
}

export type PromotableFiles = Array<PromotableFile>

export type PromotableFilename = (typeof PROMOTABLE_FILENAMES)[number]

const PROMOTABLE_FILENAMES = ["CHANGELOG.adoc", "CHANGELOG.md", "package.json"] as const

export function filterPromotableFiles(files: Files): PromotableFiles {
	return files.map(toPromotableFileOrNull).filter(notNullish)
}

function toPromotableFileOrNull(file: File): PromotableFile | null {
	const type = PROMOTABLE_FILENAMES.find(
		(filename) => file.path === filename || file.path.endsWith(`/${filename}`),
	)

	return type ? { ...file, type } : null
}
