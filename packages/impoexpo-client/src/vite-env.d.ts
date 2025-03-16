/// <reference types="vite/client" />
interface ImportMetaEnv {
	readonly VITE_APP_HASH: string;
	readonly VITE_APP_VERSION: string;
	readonly VITE_BACKEND_URL: string;
	readonly VITE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
