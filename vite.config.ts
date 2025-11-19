import { copyFile } from "node:fs/promises"
import { builtinModules } from "node:module"
import { basename, join as joinPath, resolve as resolvePath } from "node:path"
import { env } from "node:process"
import { fileURLToPath } from "node:url"
import type { Plugin, ResolvedConfig } from "vite"
import {
	defineConfig,
	mergeConfig,
	type ViteUserConfig as ViteConfig,
} from "vitest/config"

export default defineConfig(() => {
	const nodeDependencies = [
		...builtinModules,
		...builtinModules.map((moduleName) => `node:${moduleName}`),
	]
	const allDependencies = [...nodeDependencies, "ansis", "fast-glob", "tslib"]

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
			target: "es2022",
		},
		cacheDir: path("node_modules/.cache/"),
		envPrefix: "UPDRAFT_",
		plugins: [],
		resolve: {
			alias: [{ find: /^#(.+)/, replacement: path("src/$1") }],
		},
		test: {
			include: ["src/**/*.tests.ts"],
			mockReset: true,
			unstubEnvs: true,
			unstubGlobals: true,
		},
	}

	switch (env.MODULE) {
		case "cli": {
			return mergeConfig(baseConfiguration, {
				build: {
					rollupOptions: {
						external: [...allDependencies, "#program/UpdraftCliProgram"],
						input: path("src/CommandLineInterface.ts"),
						output: {
							paths: {
								"#program/UpdraftCliProgram": "../lib/index.js",
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
						input: path("src/GitHubActions.ts"),
					},
				},
			} satisfies ViteConfig)
		}
		case "lib": {
			return mergeConfig(baseConfiguration, {
				build: {
					rollupOptions: {
						external: allDependencies, // Prevents inlining the dependencies into the build artefacts.
						input: path("src/index.ts"),
						preserveEntrySignatures: "allow-extension" as const, // Preserves the exports of `index.ts`.
					},
				},
				plugins: [copyFilePlugin(path("src/index.d.ts"))],
			} satisfies ViteConfig)
		}
	}

	return baseConfiguration
})

/**
 * Resolves a path relative to the project directory.
 */
function path(pathname: string): string {
	const projectDirectory = joinPath(fileURLToPath(import.meta.url), "..")
	return resolvePath(projectDirectory, pathname)
}

function copyFilePlugin(sourcePathname: string): Plugin {
	let outputDirectory: string

	return {
		name: "copy-file",
		configResolved: (configuration: ResolvedConfig): void => {
			outputDirectory = configuration.build.outDir
		},
		closeBundle: async (): Promise<void> => {
			const outputPathname = joinPath(outputDirectory, basename(sourcePathname))
			await copyFile(sourcePathname, outputPathname)
		},
	}
}
