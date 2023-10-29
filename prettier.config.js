import organizeImportsPlugin from "prettier-plugin-organize-imports"
import packageJsonPlugin from "prettier-plugin-packagejson"

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
		organizeImportsPlugin,

		/**
		 * @see https://github.com/matzkoh/prettier-plugin-packagejson
		 */
		packageJsonPlugin,
	],
	/**
	 * We prefer to take advantage of Automatic Semicolon Insertion (ASI), which is always present in JavaScript.
	 */
	semi: false,
}
