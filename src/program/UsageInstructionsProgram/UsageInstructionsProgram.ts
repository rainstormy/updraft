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
  - CHANGELOG.md and CHANGELOG.adoc in Keep a Changelog format.
  - package.json.

Options:
  --check-sequential-release     Check if --release-version is a valid increment
                                 from the latest version specified in each file
                                 to be updated.


  --files <patterns>             Update files matching the glob patterns
                                 whenever --release-version is specified.

                                 Use whitespace to separate multiple patterns:
                                 <pattern-1> <pattern-2> <pattern-3>


  --help                         Display this help screen and exit.


  --prerelease-files <patterns>  Update files matching the glob patterns only
                                 when --release-version contains a [-prerelease]
                                 or [+buildinfo] segment.

                                 Use whitespace to separate multiple patterns:
                                 <pattern-1> <pattern-2> <pattern-3>


  --release-files <patterns>     Update files matching the glob patterns only
                                 when --release-version does not contain a
                                 [-prerelease] or [+buildinfo] segment.

                                 Use whitespace to separate multiple patterns:
                                 <pattern-1> <pattern-2> <pattern-3>


  --release-version <version>    The semantic version of the upcoming release.

                                 Expected format (optional parts in brackets):
                                 [v]major.minor.patch[-prerelease][+buildinfo]


  --version                      Display the version of this tool and exit.`
