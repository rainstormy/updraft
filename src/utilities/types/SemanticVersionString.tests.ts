import {
	type SemanticVersionString,
	extractSemanticVersionString,
	isPrerelease,
} from "+utilities/types/SemanticVersionString"
import { describe, expect, it } from "vitest"

describe.each`
	input                               | expectedSemanticVersionString
	${"0.2.0"}                          | ${"0.2.0"}
	${"v0.2.0"}                         | ${"0.2.0"}
	${"release/0.2.0"}                  | ${"0.2.0"}
	${"[0.2.0]"}                        | ${"0.2.0"}
	${"0.2.0+77dd7cf1"}                 | ${"0.2.0+77dd7cf1"}
	${"v0.2.0+77dd7cf1"}                | ${"0.2.0+77dd7cf1"}
	${"release/0.2.0+77dd7cf1"}         | ${"0.2.0+77dd7cf1"}
	${"[0.2.0+77dd7cf1]"}               | ${"0.2.0+77dd7cf1"}
	${"1.0.0"}                          | ${"1.0.0"}
	${"v1.0.0"}                         | ${"1.0.0"}
	${"release/1.0.0"}                  | ${"1.0.0"}
	${"[1.0.0]"}                        | ${"1.0.0"}
	${"1.0.0-next"}                     | ${"1.0.0-next"}
	${"v1.0.0-next"}                    | ${"1.0.0-next"}
	${"release/1.0.0-next"}             | ${"1.0.0-next"}
	${"[1.0.0-next]"}                   | ${"1.0.0-next"}
	${"2.1.0"}                          | ${"2.1.0"}
	${"v2.1.0"}                         | ${"2.1.0"}
	${"release/2.1.0"}                  | ${"2.1.0"}
	${"[2.1.0]"}                        | ${"2.1.0"}
	${"2.1.0+4905fa03"}                 | ${"2.1.0+4905fa03"}
	${"v2.1.0+4905fa03"}                | ${"2.1.0+4905fa03"}
	${"release/2.1.0+4905fa03"}         | ${"2.1.0+4905fa03"}
	${"[2.1.0+4905fa03]"}               | ${"2.1.0+4905fa03"}
	${"2.3.4"}                          | ${"2.3.4"}
	${"v2.3.4"}                         | ${"2.3.4"}
	${"release/2.3.4"}                  | ${"2.3.4"}
	${"[2.3.4]"}                        | ${"2.3.4"}
	${"2.3.4-alpha.0+e58c6301"}         | ${"2.3.4-alpha.0+e58c6301"}
	${"v2.3.4-alpha.0+e58c6301"}        | ${"2.3.4-alpha.0+e58c6301"}
	${"release/2.3.4-alpha.0+e58c6301"} | ${"2.3.4-alpha.0+e58c6301"}
	${"[2.3.4-alpha.0+e58c6301]"}       | ${"2.3.4-alpha.0+e58c6301"}
	${"10.4.1"}                         | ${"10.4.1"}
	${"v10.4.1"}                        | ${"10.4.1"}
	${"release/10.4.1"}                 | ${"10.4.1"}
	${"[10.4.1]"}                       | ${"10.4.1"}
	${"10.4.1-rc.0"}                    | ${"10.4.1-rc.0"}
	${"v10.4.1-rc.0"}                   | ${"10.4.1-rc.0"}
	${"release/10.4.1-rc.0"}            | ${"10.4.1-rc.0"}
	${"[10.4.1-rc.0]"}                  | ${"10.4.1-rc.0"}
	${"11.0.2"}                         | ${"11.0.2"}
	${"v11.0.2"}                        | ${"11.0.2"}
	${"release/11.0.2"}                 | ${"11.0.2"}
	${"[11.0.2]"}                       | ${"11.0.2"}
	${"11.0.2-beta.2+7b93b61c"}         | ${"11.0.2-beta.2+7b93b61c"}
	${"v11.0.2-beta.2+7b93b61c"}        | ${"11.0.2-beta.2+7b93b61c"}
	${"release/11.0.2-beta.2+7b93b61c"} | ${"11.0.2-beta.2+7b93b61c"}
	${"[11.0.2-beta.2+7b93b61c]"}       | ${"11.0.2-beta.2+7b93b61c"}
`(
	"when the input contains a semantic version string: $input",
	(props: {
		input: string
		expectedSemanticVersionString: SemanticVersionString
	}) => {
		it("returns the semantic version string", () => {
			const result = extractSemanticVersionString(props.input)
			expect(result).toBe(props.expectedSemanticVersionString)
		})
	},
)

describe.each`
	input
	${"0"}
	${"1.1"}
	${"77dd7cf1"}
	${"1.0-SNAPSHOT"}
	${"next"}
	${"v2"}
	${"release/2"}
	${"[]"}
`(
	"when the input does not contain a semantic version string: $input",
	(props: {
		input: string
		expectedSemanticVersionString: SemanticVersionString
	}) => {
		it("returns null", () => {
			const result = extractSemanticVersionString(props.input)
			expect(result).toBeNull()
		})
	},
)

describe.each`
	version
	${"0.2.0+77dd7cf1"}
	${"1.0.0-next"}
	${"2.1.0+4905fa03"}
	${"2.3.4-alpha.0+e58c6301"}
	${"10.4.1-rc.0"}
	${"11.0.2-beta.2+7b93b61c"}
`(
	"when the version string is $version",
	(props: { version: SemanticVersionString }) => {
		it("is a prerelease", () => {
			expect(isPrerelease(props.version)).toBe(true)
		})
	},
)

describe.each`
	version
	${"0.2.0"}
	${"1.0.0"}
	${"2.1.0"}
	${"2.3.4"}
	${"10.4.1"}
	${"11.0.2"}
`(
	"when the version string is $version",
	(props: { version: SemanticVersionString }) => {
		it("is a not prerelease", () => {
			expect(isPrerelease(props.version)).toBe(false)
		})
	},
)
