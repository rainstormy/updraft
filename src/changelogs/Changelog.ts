import { type Release } from "+utilities/Release"
import { type HyperlinkString } from "+utilities/string-types"

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
}
