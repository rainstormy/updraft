import type { SemanticVersionString } from "+utilities"

export type PromotePackageResult =
	| PromotePackageResult.Succeeded
	| PromotePackageResult.Failed

export namespace PromotePackageResult {
	export type Succeeded = {
		readonly status: "succeeded"
		readonly promotedPackageJson: object & { readonly version: string }
	}

	export type Failed = {
		readonly status: "failed"
		readonly errorMessage: string
	}
}

export function promotePackage(
	packageJson: object & { readonly version?: string },
	newVersion: SemanticVersionString,
): PromotePackageResult {
	if (packageJson.version === undefined) {
		return failed("The package.json file must have a 'version' field")
	}

	return succeeded({ ...packageJson, version: newVersion })
}

function failed(errorMessage: string): PromotePackageResult.Failed {
	return {
		status: "failed",
		errorMessage: errorMessage,
	}
}

function succeeded(
	promotedPackageJson: object & { readonly version: string },
): PromotePackageResult.Succeeded {
	return {
		status: "succeeded",
		promotedPackageJson,
	}
}
