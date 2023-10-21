import type {
	OnDisplayingMessage,
	OnReadingMatchingFiles,
	OnWritingToFiles,
} from "+adapters"
import type { OnPromotingChangelogs, PromoteChangelogs } from "+changelogs"
import type { Configuration } from "+configuration"
import type { OnPromotingPackages, PromotePackages } from "+packages"
import type { SemanticVersionString } from "+utilities"
import { dedent } from "+utilities"
import { describe, expect, it, vi } from "vitest"
import { version as toolVersion } from "../package.json" assert { type: "json" }
import { main, usageInstructions } from "./main"

describe("displaying the usage instructions", () => {
	const lines = usageInstructions.split("\n")

	it("fits within 80 columns", () => {
		for (const line of lines) {
			expect(line.length).toBeLessThanOrEqual(80)
		}
	})
})

describe("when the configuration is 'display-help-screen'", () => {
	const configuration: Configuration = { type: "display-help-screen" }

	describe("running the program", async () => {
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onReadingMatchingFiles: OnReadingMatchingFiles = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const exitCode = await main(
			{ configuration },
			{
				onDisplayingMessage,
				onPromotingChangelogs: vi.fn(),
				onPromotingPackages: vi.fn(),
				onReadingMatchingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("displays usage instructions", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				level: "info",
				message: dedent`
					Usage: release <semantic-version> [options]

					This tool prepares a new release by updating certain files accordingly.

					  <semantic-version>  The semantic version of the new release.
					                      Mandatory except for --help and --version.
					                      Format: major.minor.patch[-prerelease][+buildinfo]

					Options:
					  --changelogs <patterns>  Update changelog files matching the glob patterns.
					                           Supported formats: AsciiDoc (*.adoc).

					  --help                   Display this help screen and exit.

					  --packages <patterns>    Update package.json files matching the glob patterns.

					  --version                Display the version of this tool and exit.
				`,
			})
		})

		it("does not read the content of any file", () => {
			expect(onReadingMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	})
})

describe.each`
	toolVersion
	${"1.0.0"}
	${"2.1.0-beta.1"}
`("when the configuration is 'display-tool-version'", () => {
	const configuration: Configuration = {
		type: "display-tool-version",
		toolVersion: toolVersion as SemanticVersionString,
	}

	describe("running the program", async () => {
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onReadingMatchingFiles: OnReadingMatchingFiles = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const exitCode = await main(
			{ configuration },
			{
				onDisplayingMessage,
				onPromotingChangelogs: vi.fn(),
				onPromotingPackages: vi.fn(),
				onReadingMatchingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 0", () => {
			expect(exitCode).toBe(0)
		})

		it("displays the current version of the tool", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				level: "info",
				message: toolVersion,
			})
		})

		it("does not read the content of any file", () => {
			expect(onReadingMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	})
})

describe("when the configuration is 'error-release-version-missing'", () => {
	const configuration: Configuration = { type: "error-release-version-missing" }

	describe("running the program", async () => {
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onReadingMatchingFiles: OnReadingMatchingFiles = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const exitCode = await main(
			{ configuration },
			{
				onDisplayingMessage,
				onPromotingChangelogs: vi.fn(),
				onPromotingPackages: vi.fn(),
				onReadingMatchingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 2", () => {
			expect(exitCode).toBe(2)
		})

		it("displays an error message", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				level: "error",
				message: dedent`
					Expected the first argument to be the semantic version of the new release.
					For usage instructions, run the program with the --help option.
				`,
			})
		})

		it("does not read the content of any file", () => {
			expect(onReadingMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	})
})

describe.each`
	providedReleaseVersion
	${"next"}
	${"2.5"}
`(
	"when the configuration is 'error-release-version-invalid'",
	(input: { readonly providedReleaseVersion: string }) => {
		const { providedReleaseVersion } = input

		const configuration: Configuration = {
			type: "error-release-version-invalid",
			providedReleaseVersion,
		}

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onReadingMatchingFiles: OnReadingMatchingFiles = vi.fn()
			const onWritingToFiles: OnWritingToFiles = vi.fn()

			const exitCode = await main(
				{ configuration },
				{
					onDisplayingMessage,
					onPromotingChangelogs: vi.fn(),
					onPromotingPackages: vi.fn(),
					onReadingMatchingFiles,
					onWritingToFiles,
				},
			)

			it("returns an exit code of 2", () => {
				expect(exitCode).toBe(2)
			})

			it("displays an error message", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					level: "error",
					message: dedent`
						Expected the first argument to be a valid semantic version number, but was '${providedReleaseVersion}'.
						For usage instructions, run the program with the --help option.
					`,
				})
			})

			it("does not read the content of any file", () => {
				expect(onReadingMatchingFiles).not.toHaveBeenCalled()
			})

			it("does not write changes to any file", () => {
				expect(onWritingToFiles).not.toHaveBeenCalled()
			})
		})
	},
)

describe("when the configuration is 'error-changelog-file-pattern-missing'", () => {
	const configuration: Configuration = {
		type: "error-changelog-file-pattern-missing",
	}

	describe("running the program", async () => {
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onReadingMatchingFiles: OnReadingMatchingFiles = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const exitCode = await main(
			{ configuration },
			{
				onDisplayingMessage,
				onPromotingChangelogs: vi.fn(),
				onPromotingPackages: vi.fn(),
				onReadingMatchingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 2", () => {
			expect(exitCode).toBe(2)
		})

		it("displays an error message", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				level: "error",
				message: dedent`
					Expected one or more glob patterns to follow the --changelogs option.
					For usage instructions, run the program with the --help option.
				`,
			})
		})

		it("does not read the content of any file", () => {
			expect(onReadingMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	})
})

describe("when the configuration is 'error-package-file-pattern-missing'", () => {
	const configuration: Configuration = {
		type: "error-package-file-pattern-missing",
	}

	describe("running the program", async () => {
		const onDisplayingMessage: OnDisplayingMessage = vi.fn()
		const onReadingMatchingFiles: OnReadingMatchingFiles = vi.fn()
		const onWritingToFiles: OnWritingToFiles = vi.fn()

		const exitCode = await main(
			{ configuration },
			{
				onDisplayingMessage,
				onPromotingChangelogs: vi.fn(),
				onPromotingPackages: vi.fn(),
				onReadingMatchingFiles,
				onWritingToFiles,
			},
		)

		it("returns an exit code of 2", () => {
			expect(exitCode).toBe(2)
		})

		it("displays an error message", () => {
			expect(onDisplayingMessage).toHaveBeenCalledWith({
				level: "error",
				message: dedent`
					Expected one or more glob patterns to follow the --packages option.
					For usage instructions, run the program with the --help option.
				`,
			})
		})

		it("does not read the content of any file", () => {
			expect(onReadingMatchingFiles).not.toHaveBeenCalled()
		})

		it("does not write changes to any file", () => {
			expect(onWritingToFiles).not.toHaveBeenCalled()
		})
	})
})

describe.each`
	changelogGlobPatterns                      | packageGlobPatterns
	${["CHANGELOG.adoc"]}                      | ${["package.json"]}
	${["CHANGELOG.adoc", "lib/RELEASES.adoc"]} | ${["packages/**/package.json", "dist/package.json"]}
`(
	"when the configuration is 'prepare-release' neither $changelogGlobPatterns nor $packageGlobPatterns match any files",
	(input: {
		readonly changelogGlobPatterns: ReadonlyArray<string>
		readonly packageGlobPatterns: ReadonlyArray<string>
	}) => {
		const { changelogGlobPatterns, packageGlobPatterns } = input

		const configuration: Configuration = {
			type: "prepare-release",
			changelogGlobPatterns,
			packageGlobPatterns,
			release: { version: "2.0.0", date: "2023-04-19" },
		}

		describe("running the program", async () => {
			const onDisplayingMessage: OnDisplayingMessage = vi.fn()
			const onPromotingChangelogs: OnPromotingChangelogs = async () =>
				({
					status: "succeeded",
					outputPathsWithContent: [],
				}) satisfies PromoteChangelogs.Succeeded
			const onPromotingPackages: OnPromotingPackages = async () =>
				({
					status: "succeeded",
					outputPathsWithContent: [],
				}) satisfies PromotePackages.Succeeded
			const onReadingMatchingFiles: OnReadingMatchingFiles = async () =>
				({
					status: "succeeded",
					pathsWithContent: [],
				}) satisfies OnReadingMatchingFiles.Succeeded
			const onWritingToFiles: OnWritingToFiles = async () =>
				({
					status: "succeeded",
				}) satisfies OnWritingToFiles.Succeeded

			const exitCode = await main(
				{ configuration },
				{
					onDisplayingMessage,
					onPromotingChangelogs,
					onPromotingPackages,
					onReadingMatchingFiles,
					onWritingToFiles,
				},
			)

			it("returns an exit code of 0", () => {
				expect(exitCode).toBe(0)
			})

			it("displays two warnings", () => {
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					level: "warning",
					message: `${changelogGlobPatterns.join(
						", ",
					)} did not match any files`,
				})
				expect(onDisplayingMessage).toHaveBeenCalledWith({
					level: "warning",
					message: `${packageGlobPatterns.join(", ")} did not match any files`,
				})
			})
		})
	},
)

// TODO: Promote changelogs only.
// TODO: Promote packages only.
// TODO: Promote changelogs and packages.
// TODO: Fails to read a changelog.
// TODO: Fails to read a package.
// TODO: Fails to promote a changelog.
// TODO: Fails to promote a package, should not write changes to changelogs.
// TODO: Fails to write changes to a changelog.
// TODO: Fails to write changes to a package.
