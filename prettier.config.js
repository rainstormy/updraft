/**
 * @type {import("prettier").Options}
 *
 * @see https://prettier.io/docs/en/configuration.html
 */
export default {
	plugins: [
		/**
		 * @see https://github.com/simonhaenisch/prettier-plugin-organize-imports
		 */
		import("prettier-plugin-organize-imports"),

		/**
		 * @see https://github.com/matzkoh/prettier-plugin-packagejson
		 */
		import("prettier-plugin-packagejson"),
	],
	/**
	 * We prefer to take advantage of Automatic Semicolon Insertion (ASI), which is always present in JavaScript.
	 */
	semi: false,
}
