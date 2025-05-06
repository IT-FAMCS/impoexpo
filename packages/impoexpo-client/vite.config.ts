import * as child from "node:child_process";
import { lingui } from "@lingui/vite-plugin";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const getCommitInformation = (type: "shortHash" | "longHash" | "message") => {
	const format = type === "message" ? "%s" : type === "shortHash" ? "%h" : "%H";
	return child.execSync(`git log -1 --pretty=${format}`).toString().trim();
};

export default defineConfig(({ mode }) => {
	process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

	return {
		plugins: [
			react({
				plugins: [["@lingui/swc-plugin", {}]],
			}),
			tsconfigPaths(),
			lingui(),
		],
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
