import { defineConfig } from "@lingui/cli";

export default defineConfig({
	sourceLocale: "en",
	locales: ["ru", "en"],
	orderBy: "origin",
	catalogs: [
		{
			path: "<rootDir>/src/locales/{locale}",
			include: ["src"],
		},
	],
});
