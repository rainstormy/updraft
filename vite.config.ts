import { env } from "node:process"
import { defineOxfmtConfig } from "@rainstormy/presets-web/oxfmt"
import { defineOxlintConfig, oxlintRestrictedImportPatterns } from "@rainstormy/presets-web/oxlint"
import { defineConfig } from "vite-plus"

/**
 * Configure Vite+.
 *
 * @see https://viteplus.dev/config
 */
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
	ssr: {
		noExternal: env.UPDRAFT_PLATFORM === "cli" ? [] : ["ansis", "fast-glob"], // Inline production dependencies into the build artefacts to produce a standalone executable that runs without installing `node_modules`.
	},

	/**
	 * Configure Oxfmt.
	 *
	 * @see https://viteplus.dev/config/fmt
	 * @see https://oxc.rs/docs/guide/usage/formatter/config.html
	 */
	fmt: defineOxfmtConfig({ ignorePatterns: ["dist/**/*", "**/*.md"] }),

	/**
	 * Configure Oxlint.
	 *
	 * @see https://viteplus.dev/config/lint
	 * @see https://oxc.rs/docs/guide/usage/linter/config.html
	 */
	lint: defineOxlintConfig({
		ignorePatterns: ["dist/**/*"],
		options: {
			denyWarnings: false,
			typeCheck: false,
		},
		overrides: [
			{
				files: [
					"src/main-*.ts",
					"src/utilities/files/FileSystem.ts",
					"src/utilities/github/GithubActionInput.ts",
				],
				rules: {
					"eslint/no-restricted-imports": [
						"warn",
						{ patterns: oxlintRestrictedImportPatterns({ allowNodejs: true }) },
					],
				},
			},
		],
	}),

	/**
	 * Define tasks.
	 *
	 * @see https://viteplus.dev/config/run
	 */
	run: {
		// language=sh
		tasks: {
			build: {
				command: [
					"UPDRAFT_PLATFORM='cli' vite build --ssr src/main-cli.ts --outDir dist/cli/",
					"UPDRAFT_PLATFORM='gha' vite build --ssr src/main-gha.ts --outDir dist/gha/",
				],
				cache: { input: [{ auto: true }, "!dist/**/*"] },
			},
			check: { command: "vp lint --type-check --deny-warnings" },
			comet: { command: "comet --config .github/comet.jsonc", cache: false },
			fmt: { command: "vp check --quiet --fix" },
			install: {
				command: [
					"vp install --frozen-lockfile --ignore-scripts",
					'if [ "$LEFTHOOK" != "0" ]; then lefthook install; fi',
				],
				cache: false,
			},
			test: { command: "vp test" },
			yolo: { command: "lefthook uninstall", cache: false },
		},
	},

	/**
	 * Configure Vitest.
	 *
	 * @see https://viteplus.dev/config/test
	 * @see https://vitest.dev/config
	 */
	test: {
		fsModuleCache: true,
		include: ["src/**/*.tests.ts"],
		pool: "vmThreads",
		setupFiles: ["src/utilities/vitest/VitestSetup.fakes.ts"],
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
	},
})
