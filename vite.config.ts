import { env } from "node:process"
import { defineOxfmtConfig } from "@rainstormy/presets-web/oxfmt"
import { defineOxlintConfig, oxlintRestrictedImportPatterns } from "@rainstormy/presets-web/oxlint"
import { defineConfig } from "vite-plus"

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
	fmt: defineOxfmtConfig({ ignorePatterns: ["dist/**/*", "**/*.md"] }),
	lint: defineOxlintConfig({
		ignorePatterns: ["dist/**/*"],
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
	plugins: [],
	run: {
		tasks: {
			build: {
				// language=sh
				command: [
					"UPDRAFT_PLATFORM='cli' vite build --ssr src/main-cli.ts --outDir dist/cli/",
					"UPDRAFT_PLATFORM='gha' vite build --ssr src/main-gha.ts --outDir dist/gha/",
				],
				input: [{ auto: true }, "!dist/**/*"],
			},
			check: {
				// language=sh
				command: "vp check",
			},
			fmt: {
				// language=sh
				command: "vp check --fix",
			},
			generate: {
				command: "",
			},
			install: {
				// language=sh
				command: [
					"vp install --frozen-lockfile --ignore-scripts",
					'if [ "$LEFTHOOK" != "0" ]; then lefthook install; fi',
				],
				cache: false,
			},
			test: {
				// language=sh
				command: "vp test",
				input: [{ auto: true }, "!node_modules/.vite-temp/vite.config.ts.timestamp-*"],
			},
			yolo: {
				// language=sh
				command: "lefthook uninstall",
				cache: false,
			},
		},
	},
	ssr: {
		noExternal: env.UPDRAFT_PLATFORM === "cli" ? [] : ["ansis", "fast-glob"], // Inline production dependencies into the build artefacts to produce a standalone executable that runs without installing `node_modules`.
	},
	test: {
		include: ["src/**/*.tests.ts"],
		setupFiles: ["src/utilities/vitest/VitestSetup.fakes.ts"],
		mockReset: true,
		unstubEnvs: true,
		unstubGlobals: true,
	},
})
