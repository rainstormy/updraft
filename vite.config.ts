import { copyFile } from "node:fs/promises"
import { builtinModules } from "node:module"
import { basename, join as joinPath, resolve as resolvePath } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import type { Plugin } from "vite"
import { type UserConfig, defineConfig, mergeConfig } from "vitest/config"
import packageJson from "./package.json" assert { type: "json" }
import tsconfigJson from "./tsconfig.json" assert { type: "json" }

export default defineConfig(() => {
	const npmDependencies = Object.keys(packageJson.dependencies)
	const nodeDependencies = [
		...builtinModules,
		...builtinModules.map((moduleName) => `node:${moduleName}`),
	]
	const allDependencies = [...nodeDependencies, ...npmDependencies]

	const baseConfiguration: UserConfig = {
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
	}

	switch (process.env.MODULE) {
		case "cli": {
			return mergeConfig(baseConfiguration, {
				build: {
					rollupOptions: {
						external: [...allDependencies, "+program/UpdraftCliProgram"],
						input: inProjectDirectory("src/CommandLineInterface.ts"),
						output: {
							format: "esm",
							entryFileNames: "index.js",
							paths: {
								"+program/UpdraftCliProgram": "../lib/index.js",
							},
						},
					},
				},
			} satisfies UserConfig)
		}
		case "lib": {
			return mergeConfig(baseConfiguration, {
				build: {
					rollupOptions: {
						external: allDependencies, // Prevents inlining the dependencies into the build artifacts.
						input: inProjectDirectory("src/index.ts"),
						output: {
							format: "esm",
							entryFileNames: "index.js",
						},
						preserveEntrySignatures: "allow-extension" as const, // Preserves the exports of `index.ts`.
					},
				},
				plugins: [copyFilePlugin(inProjectDirectory("src/index.d.ts"))],
			} satisfies UserConfig)
		}
	}

	return baseConfiguration
})

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

const projectDirectory = joinPath(fileURLToPath(import.meta.url), "..")

function inProjectDirectory(relativePath: string): string {
	return resolvePath(projectDirectory, relativePath)
}

function copyFilePlugin(sourcePathname: string): Plugin {
	let outputDirectory: string

	return {
		name: "copy-file",
		configResolved: (configuration) => {
			outputDirectory = configuration.build.outDir
		},
		closeBundle: async () => {
			const outputPathname = joinPath(outputDirectory, basename(sourcePathname))
			await copyFile(sourcePathname, outputPathname)
		},
	}
}
