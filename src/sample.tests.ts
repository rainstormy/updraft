import { describe, expect, it } from "vitest"
import { sampleValue } from "./sample"

describe("a test suite", () => {
	it("contains a test case", () => {
		expect(sampleValue()).toBe(true)
	})
})
