import * as child from "node:child_process";
import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const lastCommitHash = child
	.execSync("git rev-parse --short HEAD")
	.toString()
	.trim();
export default defineConfig({
	plugins: [
		react({
			plugins: [["@lingui/swc-plugin", {}]],
		}),
		tsconfigPaths(),
		lingui(),
	],
	define: {
		"import.meta.env.VITE_APP_HASH": JSON.stringify(lastCommitHash),
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(
			process.env.npm_package_version,
		),
	},
	esbuild: {
		supported: {
			"top-level-await": true,
		},
	},
});
