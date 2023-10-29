import { builtinModules } from "node:module"
import { join as joinPath, resolve as resolvePath } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"
import tsconfigJson from "./tsconfig.json"

const projectDirectory = joinPath(fileURLToPath(import.meta.url), "..")

export default defineConfig(() => ({
	build: {
		emptyOutDir: true,
		lib: {
			entry: { sample: "./src/sample.ts" },
			formats: ["es" as const],
		},
		rollupOptions: {
			external: [
				...builtinModules,
				...builtinModules.map((moduleName) => `node:${moduleName}`),
			],
		},
	},
	plugins: [],
	resolve: {
		alias: getAliasesFromTsconfig(),
	},
	test: {
		coverage: {
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.tests.ts"],
			provider: "v8" as const,
			reportsDirectory: inProjectDirectory("node_modules/.vitest/coverage"),
		},
		include: ["src/**/*.tests.ts"],
	},
}))

function getAliasesFromTsconfig(): Record<string, string> {
	return Object.fromEntries(
		Object.entries(tsconfigJson.compilerOptions.paths).map(
			([alias, [path]]) => [alias, inProjectDirectory(path)],
		),
	)
}

function inProjectDirectory(relativePath: string): string {
	return resolvePath(projectDirectory, relativePath)
}
