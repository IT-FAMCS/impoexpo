import * as v from "valibot";

export const settingsSchema = v.object({
	editor: v.object({
		showDocumentationButton: v.boolean(),
	}),
	developer: v.object({
		nodeScreenshots: v.boolean(),
	}),
});
export type Settings = v.InferOutput<typeof settingsSchema>;

export const defaultSettings: Settings = {
	editor: {
		showDocumentationButton: true,
	},
	developer: {
		nodeScreenshots: false,
	},
};
