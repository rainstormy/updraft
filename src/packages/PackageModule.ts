import type { PathsWithContent, SemanticVersionString } from "+utilities"
import type { PackagePromotion } from "./promoter/PackagePromoter"
import { promotePackage } from "./promoter/PackagePromoter"

export type OnPromotingPackages = typeof promotePackages

export namespace PromotePackages {
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

export async function promotePackages(input: {
	readonly pathsWithContent: PathsWithContent
	readonly newReleaseVersion: SemanticVersionString
}): Promise<PromotePackages.Result> {
	const { pathsWithContent, newReleaseVersion } = input

	const outputPathsWithPromotions = pathsWithContent.map(([path, contents]) => {
		const promotion = promotePackage(contents, newReleaseVersion)
		return [path, promotion] as const
	})

	const errors = outputPathsWithPromotions
		.filter(isFailedPackagePromotion)
		.map(([filePath, promotion]) => `${filePath} ${promotion.errorMessage}`)

	if (errors.length > 0) {
		return { status: "failed", errors }
	}

	const outputPathsWithContent = outputPathsWithPromotions.map(
		([path, promotion]) => {
			const serializedPackage = (promotion as PackagePromotion.Succeeded)
				.promotedPackageContent
			return [path, serializedPackage] as const
		},
	)

	return { status: "succeeded", outputPathsWithContent }
}

function isFailedPackagePromotion(
	entry: readonly [string, PackagePromotion],
): entry is [string, PackagePromotion.Failed] {
	const [, promotion] = entry
	return promotion.status === "failed"
}
