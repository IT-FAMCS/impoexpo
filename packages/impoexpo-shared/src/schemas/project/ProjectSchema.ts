import * as v from "valibot";

export const ProjectIntegrationSchema = v.object({
	auth: v.optional(v.record(v.string(), v.unknown()), {}),
	data: v.optional(v.record(v.string(), v.unknown()), {}),
});

export const ProjectSchema = v.object({
	integrations: v.record(v.string(), ProjectIntegrationSchema),
});

export type ProjectIntegration = v.InferOutput<typeof ProjectIntegrationSchema>;
export type Project = v.InferOutput<typeof ProjectSchema>;
