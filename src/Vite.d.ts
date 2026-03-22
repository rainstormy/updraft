import type { UpdraftVersion } from "utilities/version/UpdraftVersion.ts"

interface ViteTypeOptions {
	strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
	UPDRAFT_VERSION: UpdraftVersion
}

interface ImportMeta {
	env: ImportMetaEnv
}
