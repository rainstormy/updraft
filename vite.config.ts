import { join as joinPath, resolve as resolvePath } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import tsconfigJson from "./tsconfig.json"

const projectDirectory = joinPath(fileURLToPath(import.meta.url), "..")

export default defineConfig(() => ({
	build: {
		emptyOutDir: true,
		minify: false,
		reportCompressedSize: false,
	},
	cacheDir: inProjectDirectory("node_modules/.cache/"),
	plugins: [],
	resolve: {
		alias: getAliasesFromTsconfig(),
	},
	test: {
		coverage: {
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.tests.ts"],
			provider: "v8" as const,
			reportsDirectory: inProjectDirectory(
				"node_modules/.cache/vitest/coverage/",
			),
		},
		include: ["src/**/*.tests.ts"],
		mockReset: true,
	},
}))

function getAliasesFromTsconfig(): Record<string, string> {
	return Object.fromEntries(
		Object.entries(tsconfigJson.compilerOptions.paths).map(
			([alias, [path]]) => [
				alias.slice(0, -"/*".length),
				inProjectDirectory(path.slice(0, -"/*".length)),
			],
		),
	)
}

function inProjectDirectory(relativePath: string): string {
	return resolvePath(projectDirectory, relativePath)
}
