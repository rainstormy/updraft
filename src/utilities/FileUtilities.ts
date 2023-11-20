export type FileType = "changelog-asciidoc" | "node-package-json"

export type PathWithContent = readonly [path: string, content: string]
export type PathsWithContent = ReadonlyArray<PathWithContent>

export type PathWithFileType = readonly [path: string, type: FileType]
export type PathsWithFileType = ReadonlyArray<PathWithFileType>
