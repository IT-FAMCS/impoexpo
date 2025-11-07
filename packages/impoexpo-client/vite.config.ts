import * as child from "node:child_process";
import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vike from "vike/plugin";
import tailwindcss from "@tailwindcss/vite";
import sonda from "sonda/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const getCommitInformation = (type: "shortHash" | "longHash" | "message") => {
	const format = type === "message" ? "%s" : type === "shortHash" ? "%h" : "%H";
	return child.execSync(`git log -1 --pretty=${format}`).toString().trim();
};

export default defineConfig(({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return {
		plugins: [
			react({
				babel: {
					plugins: [
						"@lingui/babel-plugin-lingui-macro",
						"babel-plugin-react-compiler",
					],
				},
			}),
			tsconfigPaths(),
			tailwindcss(),
			lingui(),
			sonda(),
			injectReactScan(),
			vike(),
		],
		build: {
			sourcemap: true,
		},
		define: {
			"import.meta.env.VITE_APP_HASH": JSON.stringify(
				getCommitInformation("shortHash"),
			),
			"import.meta.env.VITE_APP_LAST_COMMIT_LINK": JSON.stringify(
				`${process.env.VITE_GIT_BASE}/${getCommitInformation("longHash")}`,
			),
			"import.meta.env.VITE_APP_LAST_COMMIT_MESSAGE": JSON.stringify(
				getCommitInformation("message"),
			),
			"import.meta.env.VITE_APP_VERSION": JSON.stringify(
				process.env.npm_package_version,
			),
		},
		esbuild: {
			supported: {
				"top-level-await": true,
			},
		},
	};
});

const injectReactScan = () => {
	return {
		name: "inject-react-scan",
		apply: "serve",
		transformIndexHtml: (html) => {
			return {
				html,
				tags: [
					{
						tag: "script",
						attrs: {
							src: "//unpkg.com/react-scan/dist/auto.global.js",
							crossOrigin: "anonymous",
						},
						injectTo: "head-prepend",
					},
				],
			};
		},
	} satisfies Plugin;
};
