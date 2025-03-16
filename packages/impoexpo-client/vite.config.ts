import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import * as child from "node:child_process";

const lastCommitHash = child
	.execSync("git rev-parse --short HEAD")
	.toString()
	.trim();
export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	define: {
		"import.meta.env.VITE_APP_HASH": JSON.stringify(lastCommitHash),
		"import.meta.env.VITE_APP_VERSION": JSON.stringify(
			process.env.npm_package_version,
		),
	},
});
