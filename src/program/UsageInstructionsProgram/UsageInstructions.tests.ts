import { usageInstructions } from "+program/UsageInstructionsProgram/UsageInstructionsProgram"
import { dedent } from "+utilities/StringUtilities"
import { expect, it } from "vitest"

it("is a list of program arguments and options", () => {
	expect(usageInstructions).toBe(dedent`
		Usage: updraft [options]

		This tool prepares a repository for an upcoming release by updating changelogs
		and bumping version numbers in package.json files.

		Supported file formats:
		  * AsciiDoc-based changelogs (*.adoc) in Keep a Changelog format.
		  * Markdown-based changelogs (*.md) in Keep a Changelog format.
		  * package.json.

		Options:
		  --files <patterns>           Update files matching the glob patterns.
		                               Mandatory when --release-version is specified.

		                               Use whitespace to separate multiple patterns:
		                               <pattern-1> <pattern-2> <pattern-3>

		  --help                       Display this help screen and exit.

		  --release-version <version>  The semantic version of the upcoming release.
		                               Mandatory when --files is specified.

		                               Expected format (optional parts in brackets):
		                               [v]major.minor.patch[-prerelease][+buildinfo]

		  --version                    Display the version of this tool and exit.
	`)
})

it("fits within 80 columns", () => {
	const lines = usageInstructions.split("\n")

	for (const line of lines) {
		expect(line.length).toBeLessThanOrEqual(80)
	}
})
