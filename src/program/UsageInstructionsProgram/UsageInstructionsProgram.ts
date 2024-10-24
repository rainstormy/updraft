import { printMessage } from "+adapters/Logger/Logger"
import type { ExitCode } from "+utilities/ErrorUtilities"
import { bold, cyan, yellow } from "ansis"

export async function usageInstructionsProgram(): Promise<ExitCode> {
	printMessage(getUsageInstructions())
	return 0
}

export function getUsageInstructions(): string {
	return `${bold`Usage:`} updraft [options]

This tool prepares a repository for an upcoming release by updating changelogs
and bumping version numbers in package.json files.

Supported file formats:
  - ${yellow`CHANGELOG.md`} and ${yellow`CHANGELOG.adoc`} in Keep a Changelog format.
  - ${yellow`package.json`}.

Options:
  ${cyan.bold`--check-sequential-release`}
      Verify that ${cyan`--release-version`} specifies a valid increment from the latest
      version detected in each file to be updated.

  ${cyan`${bold`--files`} <pattern-1> <pattern-2> <pattern-3>...`}
      Update the files matching the specified glob patterns whenever
      ${cyan`--release-version`} is specified.

  ${cyan.bold`--help`}
      Display this help screen and exit.

  ${cyan`${bold`--prerelease-files`} <pattern-1> <pattern-2> <pattern-3>...`}
      Update the files matching the specified glob patterns only when
      ${cyan`--release-version`} has a ${yellow`-prerelease`} or ${yellow`+buildinfo`} segment.

  ${cyan`${bold`--release-files`} <pattern-1> <pattern-2> <pattern-3>...`}
      Update the files matching the specified glob patterns only when
      ${cyan`--release-version`} does not have a ${yellow`-prerelease`} or ${yellow`+buildinfo`} segment.

  ${cyan`${bold`--release-version`} <major.minor.patch[-prerelease][+buildinfo]>`}
      The semantic version number (SemVer) of the next release. The ${yellow`-prerelease`}
      and ${yellow`+buildinfo`} segments are optional.
      It accepts any input containing a substring that is a semantic version
      number, e.g. ${yellow`v2.0.0`} or ${yellow`release/1.5.0-rc.0`}.

  ${cyan.bold`--version`}
      Display the version of this tool and exit.`
}
