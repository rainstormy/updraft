import type { Release } from "+utilities/Release"
import type { HyperlinkString } from "+utilities/StringUtilities"

export type Changelog = {
	preamble: string
	sections: Array<Changelog.Section>
}

export namespace Changelog {
	export type Section = {
		repositoryUrl: RepositoryUrlString | null
		previousRelease: Release | null
		release: Release | null
		sectionBody: string
	}

	export type RepositoryUrlString = CustomAttributeString | HyperlinkString
	type CustomAttributeString = `{${string}}`
}
