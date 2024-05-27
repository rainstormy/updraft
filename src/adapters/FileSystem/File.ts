export type File = {
	content: string
	path: string
	type: File.Type
}
export type Files = Array<File>

export namespace File {
	export type Type = "asciidoc-changelog" | "package-json"
}
