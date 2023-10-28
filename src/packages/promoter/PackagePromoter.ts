import type { SemanticVersionString } from "+utilities"

export type PackagePromotion =
	| PackagePromotion.Succeeded
	| PackagePromotion.Failed

export namespace PackagePromotion {
	export type Succeeded = {
		readonly status: "succeeded"
		readonly promotedPackageContent: string
	}

	export type Failed = {
		readonly status: "failed"
		readonly errorMessage: string
	}
}

const versionFieldRegex = /"version":\s*"(?<semanticVersionNumbe>[^"]+)"/u

export function promotePackage(
	content: string,
	newVersion: SemanticVersionString,
): PackagePromotion {
	const hasVersionField = versionFieldRegex.test(content)

	if (!hasVersionField) {
		return failed("must have a 'version' field")
	}

	const newContent = content.replace(
		versionFieldRegex,
		`"version": "${newVersion}"`,
	)

	return succeeded(newContent)
}

function failed(errorMessage: string): PackagePromotion.Failed {
	return { status: "failed", errorMessage: errorMessage }
}

function succeeded(promotedPackageContent: string): PackagePromotion.Succeeded {
	return { status: "succeeded", promotedPackageContent }
}
