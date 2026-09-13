import * as child from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import sonda from "sonda/vite";
import vike from "vike/plugin";
import { defineConfig, loadEnv, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const getCommitInformation = (type: "shortHash" | "longHash" | "message") => {
	const format = type === "message" ? "%s" : type === "shortHash" ? "%h" : "%H";
	return child.execSync(`git log -1 --pretty=${format}`).toString().trim();
};

export default defineConfig(({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return {
		plugins: [
			react(),
			lingui(),
			babel({
				presets: [reactCompilerPreset(), linguiTransformerBabelPreset()],
			}),
			tsconfigPaths(),
			tailwindcss(),
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
				`${process.env.VITE_GIT_BASE}/commit/${getCommitInformation("longHash")}`,
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
