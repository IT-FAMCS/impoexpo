import * as v from "valibot";

export const settingsSchema = v.object({
	editor: v.object({
		showDocumentationButton: v.boolean(),
		debug: v.boolean(),
	}),
	developer: v.object({
		nodeScreenshots: v.boolean(),
		alwaysShowTypes: v.boolean(),
	}),
});
export type Settings = v.InferOutput<typeof settingsSchema>;

export const defaultSettings: Settings = {
	editor: {
		showDocumentationButton: true,
		debug: false,
	},
	developer: {
		nodeScreenshots: false,
		alwaysShowTypes: false,
	},
};
