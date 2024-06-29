export function parseArgs<Option extends string>(
	args: Array<string>,
	options: Array<Option>,
): Record<Option, Array<string> | null> {
	const parsedArgs = Object.fromEntries(
		options.map((option) => [option, null]),
	) as Record<Option, Array<string> | null>

	let currentOption: Option | null = null

	for (const arg of args) {
		if (isOption(arg)) {
			if (parsedArgs[arg] !== null) {
				throw new Error(`${arg} cannot appear more than once.`)
			}
			currentOption = arg
			parsedArgs[currentOption] = [] as Array<string>
			continue
		}
		if (arg.startsWith("-")) {
			throw new Error(`Unknown option '${arg}'.`)
		}
		if (currentOption !== null) {
			parsedArgs[currentOption]?.push(arg)
		}
	}

	return parsedArgs

	function isOption(arg: string): arg is Option {
		return (options as Array<string>).includes(arg)
	}
}
