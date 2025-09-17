import vikeReact from "vike-react/config";
import type { Config } from "vike/types";

export default {
	prerender: true,
	ssr: false,

	extends: [vikeReact],

	title: "impoexpo",
	description: "a simpler way to transfer data",
} satisfies Config;
