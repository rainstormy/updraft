import { printMessage } from "+adapters/Logger/Logger"
import type { ExitCode } from "+utilities/ErrorUtilities"

export async function usageInstructionsProgram(): Promise<ExitCode> {
	printMessage(usageInstructions)
	return 0
}

export const usageInstructions = `Usage: updraft [options]

This tool prepares a repository for an upcoming release by updating changelogs
and bumping version numbers in package.json files.

Supported file formats:
  * AsciiDoc-based changelogs (*.adoc) in Keep a Changelog format.
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

  --version                    Display the version of this tool and exit.`
