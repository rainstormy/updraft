import { env } from "node:process"
import { defineConfig } from "vitest/config"

export default defineConfig({
	build: {
		emptyOutDir: true,
		minify: "oxc",
		reportCompressedSize: false,
		rolldownOptions: {
			output: { entryFileNames: "index.js" },
		},
		target: "es2022",
	},
	cacheDir: "node_modules/.cache/",
	envPrefix: "UPDRAFT_",
	plugins: [],
	ssr: {
		noExternal: env.UPDRAFT_PLATFORM === "cli" ? [] : ["ansis", "fast-glob"], // Inline production dependencies into the build artefacts to produce a standalone executable that runs without installing `node_modules`.
	},
	test: {
		include: ["src/**/*.tests.ts"],
		setupFiles: ["src/utilities/vitest/VitestSetup.mocks.ts"],
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
	},
})
