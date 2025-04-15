import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./index.html",
		"./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {},
	},
	safelist: [
		"pr-4",
		"pl-4",
		"ml-2",
		"max-w-64",
		"bg-secondary-200",
		"bg-primary-200",
		"bg-warning-200",
		"bg-success-200",
	],
	darkMode: "class",
	plugins: [
		heroui({
			themes: {
				dark: {
					colors: {
						background: "#101010",
					},
				},
			},
		}),
	],
};
