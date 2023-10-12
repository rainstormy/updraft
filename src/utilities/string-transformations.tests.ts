import { describe, expect, it } from "vitest"
import { dedent } from "./string-transformations"

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
		expect(result).toBe("Hello, world!\n" + "How are you?")
	})
})

describe("dedenting a multi-line string with a leading newline and without indents", () => {
	const result = dedent`
Hello, world!
How are you?`

	it("removes the leading newline", () => {
		expect(result).toBe("Hello, world!\n" + "How are you?")
	})
})

describe("dedenting a multi-line string with a trailing newline and without indents", () => {
	const result = dedent`Hello, world!
How are you?
`

	it("preserves the trailing newline", () => {
		expect(result).toBe("Hello, world!\n" + "How are you?")
	})
})

describe("dedenting a multi-line string with an indented trailing newline and without any other indents", () => {
	const result = dedent`Hello, world!
How are you?
	`

	it("preserves the indented trailing newline", () => {
		expect(result).toBe("Hello, world!\n" + "How are you?\n" + "\t")
	})
})

describe("dedenting a multi-line string with an empty common indent level", () => {
	const result = dedent`
            Hello, world!
How are you?
`

	it("returns the original string", () => {
		expect(result).toBe("            Hello, world!\n" + "How are you?")
	})
})

describe("dedenting a multi-line string with a common indent level of 4 spaces", () => {
	const result = dedent`
        Hello, world!
    How are you?
`

	it("removes 4 leading spaces from every line", () => {
		expect(result).toBe("    Hello, world!\n" + "How are you?")
	})
})

describe("dedenting a multi-line string with a common indent level of 8 spaces", () => {
	const result = dedent`
        Hello, world!
        How are you?
`

	it("removes 8 leading spaces from every line", () => {
		expect(result).toBe("Hello, world!\n" + "How are you?")
	})
})

describe("dedenting a multi-line string with a common indent level of 1 tab", () => {
	const result = dedent`
	Hello, world!
		How are you?
`

	it("removes 1 leading tab from every line", () => {
		expect(result).toBe("Hello, world!\n" + "\tHow are you?")
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
			"function doStuff() {\n" + "\tconsole.log('Hello, world!')\n" + "}",
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
		expect(result).toBe("Hello, world!\n" + "How are you?")
	})
})

describe("dedenting a string with a single-line interpolation with an extra leading indent and a common indent level of 1 tab", () => {
	const interpolatedValue = "How are you?"

	const result = dedent`
	Hello, world!
		${interpolatedValue}
`

	it("removes 1 leading tab from every line", () => {
		expect(result).toBe("Hello, world!\n" + "\tHow are you?")
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
