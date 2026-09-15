import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

export default defineConfig({
	plugins: [
		tailwindcss(),
		reactRouter(),
		babel({
			include: /\.tsx?$/,
			presets: [reactCompilerPreset()],
		}),
	],
	resolve: {
		tsconfigPaths: true,
	},
});
