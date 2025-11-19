/// <reference types="vite/client" />
/// <reference path="utilities/version/UpdraftVersion" />

interface ViteTypeOptions {
	strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
	UPDRAFT_VERSION: UpdraftVersion
}

interface ImportMeta {
	env: ImportMetaEnv
}
