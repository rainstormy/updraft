import { pluralise } from "+utilities/StringUtilities"

export function parseArgs<Option extends string>(
	schema: OptionSchema<Option>,
	args: Array<string>,
): Record<Option, Array<string> | undefined> {
	const parsedArgs: Record<string, Array<string> | undefined> = {}
	let currentOption: string | null = null

	for (const arg of args) {
		if (arg.startsWith("-")) {
			currentOption = arg
			parsedArgs[currentOption] = parsedArgs[currentOption] ?? []
		} else if (currentOption !== null) {
			parsedArgs[currentOption]?.push(arg)
		}
	}

	assertNoInvalidOptions(schema, parsedArgs)
	assertRequiredOptions(schema, parsedArgs)
	assertExactNumberOfOptionArguments(schema, parsedArgs)
	assertMinimumNumberOfOptionArguments(schema, parsedArgs)
	assertMaximumNumberOfOptionArguments(schema, parsedArgs)

	return parsedArgs
}

function assertNoInvalidOptions<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<string, Array<string> | undefined>,
): asserts parsedArgs is Record<Option, Array<string> | undefined> {
	for (const observedOption of Object.keys(parsedArgs)) {
		if (!(observedOption in schema)) {
			throw new Error(`Unknown option '${observedOption}'.`)
		}
	}
}

function assertRequiredOptions<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<
		[Option, OptionConstraints]
	>

	for (const [option, { required }] of constraints) {
		if (required && !(option in parsedArgs)) {
			throw new Error(`${option} is required.`)
		}
	}
}

function assertExactNumberOfOptionArguments<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<
		[Option, OptionConstraints]
	>

	for (const [option, { args }] of constraints) {
		const argsCount = parsedArgs[option]?.length ?? null
		const min = args.min ?? null
		const max = args.max ?? null

		if (min !== null && min === max && argsCount !== min) {
			const constraint = `${min} ${pluralise(min, "argument")}`
			throw new Error(`${option} requires ${constraint}, but got ${argsCount}.`)
		}
	}
}

function assertMinimumNumberOfOptionArguments<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<
		[Option, OptionConstraints]
	>

	for (const [option, { args }] of constraints) {
		const argsCount = parsedArgs[option]?.length ?? Number.POSITIVE_INFINITY
		const min = args.min ?? null

		if (min !== null && argsCount < min) {
			const constraint = `at least ${min} ${pluralise(min, "argument")}`
			throw new Error(`${option} requires ${constraint}, but got ${argsCount}.`)
		}
	}
}

function assertMaximumNumberOfOptionArguments<Option extends string>(
	schema: OptionSchema<Option>,
	parsedArgs: Record<Option, Array<string> | undefined>,
): void {
	const constraints = Object.entries(schema) as Array<
		[Option, OptionConstraints]
	>

	for (const [option, { args }] of constraints) {
		const argsCount = parsedArgs[option]?.length ?? Number.NEGATIVE_INFINITY
		const max = args.max ?? null

		if (max !== null && argsCount > max) {
			const constraint = `at most ${max} ${pluralise(max, "argument")}`
			throw new Error(`${option} requires ${constraint}, but got ${argsCount}.`)
		}
	}
}

export function defineOptions<Option extends string>(
	optionSchema: OptionSchema<Option>,
): OptionSchema<Option> {
	return optionSchema
}

export type OptionSchema<Option extends string> = Record<
	Option,
	OptionConstraints
>

type OptionConstraints = {
	args: {
		min?: number
		max?: number
	}
	required?: true
}
