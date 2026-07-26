import { defineOxlintConfig, oxlintRestrictedImportPatterns } from "@rainstormy/presets-web/oxlint"

export default defineOxlintConfig({
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
})
