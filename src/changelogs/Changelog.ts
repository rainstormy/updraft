import type {
	DateString,
	HyperlinkString,
	SemanticVersionString,
} from "+utilities"

export type Changelog = {
	readonly preamble: string
	readonly sections: ReadonlyArray<Changelog.Section>
}

export namespace Changelog {
	export type Section = {
		readonly repositoryUrl: RepositoryUrlString | null
		readonly previousRelease: Release | null
		readonly release: Release | null
		readonly sectionBody: string
	}

	export type RepositoryUrlString = CustomAttributeString | HyperlinkString
	type CustomAttributeString = `{${string}}`

	export type Release = {
		readonly version: SemanticVersionString
		readonly date: DateString
	}
}
