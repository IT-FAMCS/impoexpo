import * as v from "valibot";

export const ProjectStatusNotificationSchema = v.object({
	type: v.picklist(["error", "warn", "info", "debug"]),
	message: v.string(),
});

export type ProjectStatusNotification = v.InferOutput<
	typeof ProjectStatusNotificationSchema
>;
