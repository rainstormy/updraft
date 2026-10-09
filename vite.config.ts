import { env } from "node:process"
import { defineOxfmtConfig } from "@rainstormy/presets-web/oxfmt"
import { defineOxlintConfig, oxlintRestrictedImportPatterns } from "@rainstormy/presets-web/oxlint"
import { type UserConfig, defineConfig } from "vite-plus"

type UserOxfmtConfig = NonNullable<UserConfig["fmt"]>

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
	fmt: defineOxfmtConfig({ ignorePatterns: ["dist/**/*", "**/*.md"] }) as UserOxfmtConfig,
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
		// language=sh
		tasks: {
			build: {
				command: [
					"UPDRAFT_PLATFORM='cli' vite build --ssr src/main-cli.ts --outDir dist/cli/",
					"UPDRAFT_PLATFORM='gha' vite build --ssr src/main-gha.ts --outDir dist/gha/",
				],
				cache: { input: [{ auto: true }, "!dist/**/*"] },
			},
			check: { command: "vp check" },
			fmt: { command: "vp check --fix" },
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
