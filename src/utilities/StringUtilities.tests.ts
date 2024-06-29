import {
	type SemanticVersionString,
	dedent,
	extractSemanticVersionString,
	isPrerelease,
} from "+utilities/StringUtilities"
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

describe("dedenting an empty string", () => {
	const result = dedent``

	it("returns an empty string", () => {
		expect(result).toBe("")
	})
})

describe("dedenting a string that contains whitespace only", () => {
	const result = dedent`   `

	it("returns an empty string", () => {
		expect(result).toBe("")
	})
})

describe("dedenting a single-line string", () => {
	const result = dedent`Hello, world!`

	it("returns the original string", () => {
		expect(result).toBe("Hello, world!")
	})
})

describe("dedenting a multi-line string without indents", () => {
	const result = dedent`Hello, world!
How are you?`

	it("returns the original string", () => {
		expect(result).toBe("Hello, world!\nHow are you?")
	})
})

describe("dedenting a multi-line string with a leading newline and without indents", () => {
	const result = dedent`
Hello, world!
How are you?`

	it("removes the leading newline", () => {
		expect(result).toBe("Hello, world!\nHow are you?")
	})
})

describe("dedenting a multi-line string with a trailing newline and without indents", () => {
	const result = dedent`Hello, world!
How are you?
`

	it("preserves the trailing newline", () => {
		expect(result).toBe("Hello, world!\nHow are you?")
	})
})

describe("dedenting a multi-line string with an indented trailing newline and without any other indents", () => {
	const result = dedent`Hello, world!
How are you?
	`

	it("preserves the indented trailing newline", () => {
		expect(result).toBe("Hello, world!\nHow are you?\n\t")
	})
})

describe("dedenting a multi-line string with an empty common indent level", () => {
	const result = dedent`
            Hello, world!
How are you?
`

	it("returns the original string", () => {
		expect(result).toBe("            Hello, world!\nHow are you?")
	})
})

describe("dedenting a multi-line string with a common indent level of 4 spaces", () => {
	const result = dedent`
        Hello, world!
    How are you?
`

	it("removes 4 leading spaces from every line", () => {
		expect(result).toBe("    Hello, world!\nHow are you?")
	})
})

describe("dedenting a multi-line string with a common indent level of 8 spaces", () => {
	const result = dedent`
        Hello, world!
        How are you?
`

	it("removes 8 leading spaces from every line", () => {
		expect(result).toBe("Hello, world!\nHow are you?")
	})
})

describe("dedenting a multi-line string with a common indent level of 1 tab", () => {
	const result = dedent`
	Hello, world!
		How are you?
`

	it("removes 1 leading tab from every line", () => {
		expect(result).toBe("Hello, world!\n\tHow are you?")
	})
})

describe("dedenting a multi-line string with an indented trailing newline with a common indent level of 3 tabs", () => {
	const result = dedent`
			function doStuff() {
				console.log('Hello, world!')
			}
	`

	it("removes 3 leading tabs from every line and discards the indent of the trailing newline", () => {
		expect(result).toBe(
			"function doStuff() {\n\tconsole.log('Hello, world!')\n}",
		)
	})
})

describe("dedenting a string with a single-line interpolation and a common indent level of 1 tab", () => {
	const interpolatedValue = "How are you?"

	const result = dedent`
	Hello, world!
	${interpolatedValue}
`

	it("removes 1 leading tab from every line", () => {
		expect(result).toBe("Hello, world!\nHow are you?")
	})
})

describe("dedenting a string with a single-line interpolation with an extra leading indent and a common indent level of 1 tab", () => {
	const interpolatedValue = "How are you?"

	const result = dedent`
	Hello, world!
		${interpolatedValue}
`

	it("removes 1 leading tab from every line", () => {
		expect(result).toBe("Hello, world!\n\tHow are you?")
	})
})

describe("dedenting a string with a multi-line interpolation and a common indent level of 2 tabs", () => {
	const interpolatedValue = dedent`
		function doStuff() {
			console.log('Hello, world!')
		}
	`

	const result = dedent`
		console.log('Welcome')
		${interpolatedValue}
	`

	it("removes 2 leading tabs from every line", () => {
		expect(result).toBe(
			"console.log('Welcome')\n" +
				"function doStuff() {\n" +
				"\tconsole.log('Hello, world!')\n" +
				"}",
		)
	})
})

describe("dedenting a string with two multi-line interpolations of different indent levels and a common indent level of 1 tab", () => {
	const firstInterpolatedValue = dedent`
		function doStuff() {
			console.log('Hello, world!')
		}
	`

	const secondInterpolatedValue = dedent`
			function doMoreStuff() {
				console.log('What's updog?')
			}
	`

	const result = dedent`
	console.log('Welcome')
		${firstInterpolatedValue}
	${secondInterpolatedValue}
`

	it("removes 1 leading tab from every line", () => {
		expect(result).toBe(
			"console.log('Welcome')\n" +
				"\tfunction doStuff() {\n" +
				"\t\tconsole.log('Hello, world!')\n" +
				"\t}\n" +
				"function doMoreStuff() {\n" +
				"\tconsole.log('What's updog?')\n" +
				"}",
		)
	})
})
