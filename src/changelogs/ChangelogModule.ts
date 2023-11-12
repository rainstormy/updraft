import { type PathsWithContent } from "+utilities/io-types"
import { type Changelog } from "./Changelog"
import { parseAsciidocChangelog } from "./parsers/AsciidocChangelogParser"
import {
	promoteChangelog,
	type ChangelogPromotion,
} from "./promoter/ChangelogPromoter"
import { serializeChangelogToAsciidoc } from "./serializers/AsciidocChangelogSerializer"

export type OnPromotingChangelogs = typeof promoteChangelogs

export namespace PromoteChangelogs {
	export type Result = Failed | Succeeded

	export type Failed = {
		readonly status: "failed"
		readonly errors: ReadonlyArray<string>
	}

	export type Succeeded = {
		readonly status: "succeeded"
		readonly outputPathsWithContent: PathsWithContent
	}
}

export async function promoteChangelogs(input: {
	readonly pathsWithContent: PathsWithContent
	readonly newRelease: Changelog.Release
}): Promise<PromoteChangelogs.Result> {
	const { pathsWithContent, newRelease } = input

	const outputPathsWithPromotions = pathsWithContent.map(([path, contents]) => {
		const originalChangelog = parseAsciidocChangelog(contents)
		const promotion = promoteChangelog(originalChangelog, newRelease)
		return [path, promotion] as const
	})

	const errors = outputPathsWithPromotions
		.filter(isFailedChangelogPromotion)
		.map(([path, promotion]) => `${path} ${promotion.errorMessage}`)

	if (errors.length > 0) {
		return { status: "failed", errors }
	}

	const outputPathsWithContent = outputPathsWithPromotions.map(
		([path, promotion]) => {
			const serializedChangelog = serializeChangelogToAsciidoc(
				(promotion as ChangelogPromotion.Succeeded).promotedChangelog,
			)
			return [path, serializedChangelog] as const
		},
	)

	return { status: "succeeded", outputPathsWithContent }
}

function isFailedChangelogPromotion(
	entry: readonly [string, ChangelogPromotion],
): entry is [string, ChangelogPromotion.Failed] {
	const [, promotion] = entry
	return promotion.status === "failed"
}
