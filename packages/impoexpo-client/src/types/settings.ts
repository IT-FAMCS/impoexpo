import * as v from "valibot";

export const settingsSchema = v.object({
	developer: v.object({
		nodeScreenshots: v.boolean(),
	}),
});
export type Settings = v.InferOutput<typeof settingsSchema>;

export const defaultSettings: Settings = {
	developer: {
		nodeScreenshots: false,
	},
};
