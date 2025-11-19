import process from "node:process"
import { notFalse } from "#utilities/IterableUtilities.ts"
import { toStringArray } from "#utilities/StringUtilities.ts"

export function getArgsFromActionInput(): Array<string> {
	const checkSequentialRelease = getBooleanInput("check-sequential-release")
	const files = getStringArrayInput("files")
	const prereleaseFiles = getStringArrayInput("prerelease-files")
	const releaseFiles = getStringArrayInput("release-files")
	const releaseVersion = getStringInput("release-version")

	const args = [
		checkSequentialRelease && ["--check-sequential-release"],
		files.length > 0 && ["--files", ...files],
		prereleaseFiles.length > 0 && ["--prerelease-files", ...prereleaseFiles],
		releaseFiles.length > 0 && ["--release-files", ...releaseFiles],
		releaseVersion !== null && ["--release-version", releaseVersion],
	]

	return args.filter(notFalse).flat()
}

function getStringInput(inputName: string): string | null {
	const value = process.env[`INPUT_${inputName.toUpperCase()}`] ?? ""
	return value !== "" ? value : null
}

function getStringArrayInput(inputName: string): Array<string> {
	const value = getStringInput(inputName)
	return value !== null ? toStringArray(value) : []
}

function getBooleanInput(inputName: string): boolean {
	const value = getStringInput(inputName)?.toLowerCase()
	return value === "true" || value === "yes" || value === "y" || value === "on"
}
