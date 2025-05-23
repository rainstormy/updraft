import { copyFile } from "node:fs/promises"
import { builtinModules } from "node:module"
import { basename, join as joinPath, resolve as resolvePath } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import type { Plugin } from "vite"
import {
	type ViteUserConfig as ViteConfig,
	defineConfig,
	mergeConfig,
} from "vitest/config"
import packageJson from "./package.json" assert { type: "json" }
import tsconfigJson from "./tsconfig.json" assert { type: "json" }

export default defineConfig(() => {
	const npmDependencies = Object.keys(packageJson.dependencies)
	const nodeDependencies = [
		...builtinModules,
		...builtinModules.map((moduleName) => `node:${moduleName}`),
	]
	const allDependencies = [...nodeDependencies, ...npmDependencies]

	const baseConfiguration: ViteConfig = {
		build: {
			emptyOutDir: true,
			minify: false,
			reportCompressedSize: false,
			rollupOptions: {
				output: {
					format: "esm",
					entryFileNames: "index.js",
				},
			},
		},
		cacheDir: inProjectDirectory("node_modules/.cache/"),
		plugins: [],
		resolve: {
			alias: tsconfigPathAliases(),
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
							paths: {
								"+program/UpdraftCliProgram": "../lib/index.js",
							},
						},
					},
				},
			} satisfies ViteConfig)
		}
		case "gha": {
			return mergeConfig(baseConfiguration, {
				build: {
					rollupOptions: {
						external: nodeDependencies,
						input: inProjectDirectory("src/GitHubActions.ts"),
					},
				},
			} satisfies ViteConfig)
		}
		case "lib": {
			return mergeConfig(baseConfiguration, {
				build: {
					rollupOptions: {
						external: allDependencies, // Prevents inlining the dependencies into the build artifacts.
						input: inProjectDirectory("src/index.ts"),
						preserveEntrySignatures: "allow-extension" as const, // Preserves the exports of `index.ts`.
					},
				},
				plugins: [copyFilePlugin(inProjectDirectory("src/index.d.ts"))],
			} satisfies ViteConfig)
		}
	}

	return baseConfiguration
})

function tsconfigPathAliases(): Record<string, string> {
	return Object.fromEntries(
		Object.entries(tsconfigJson.compilerOptions.paths).map((entry) => {
			assertSinglePath(entry)
			const [alias, [path]] = entry
			return [
				alias.slice(0, -"/*".length),
				inProjectDirectory(path.slice(0, -"/*".length)),
			]
		}),
	)
}

function assertSinglePath(
	entry: [alias: string, paths: Array<string>],
): asserts entry is [alias: string, paths: [string]] {
	const [alias, paths] = entry
	if (paths.length !== 1) {
		throw new Error(
			`Path alias '${alias}' in 'tsconfig.json' must specify exactly one path, but has ${paths.length} paths`,
		)
	}
}

const projectDirectory = joinPath(fileURLToPath(import.meta.url), "..")

function inProjectDirectory(relativePath: string): string {
	return resolvePath(projectDirectory, relativePath)
}

function copyFilePlugin(sourcePathname: string): Plugin {
	let outputDirectory: string

	return {
		name: "copy-file",
		configResolved: (configuration): void => {
			outputDirectory = configuration.build.outDir
		},
		closeBundle: async (): Promise<void> => {
			const outputPathname = joinPath(outputDirectory, basename(sourcePathname))
			await copyFile(sourcePathname, outputPathname)
		},
	}
}
