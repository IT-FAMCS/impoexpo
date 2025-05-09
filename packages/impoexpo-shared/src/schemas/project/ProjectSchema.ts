import * as v from "valibot";

export const ProjectNodeEntrySchema = v.object({
	type: v.picklist(["independent", "dependent"]),
	sources: v.optional(
		v.array(v.object({ node: v.string(), entry: v.string() })),
	),
	value: v.optional(v.unknown()),
});

export const ProjectNodeSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty()),
	type: v.pipe(v.string(), v.nonEmpty()),
	inputs: v.record(v.string(), ProjectNodeEntrySchema),
	outputs: v.record(v.string(), ProjectNodeEntrySchema),
});

export const ProjectIntegrationSchema = v.object({
	auth: v.optional(v.record(v.string(), v.unknown())),
	data: v.optional(v.record(v.string(), v.unknown())),
});

export const ProjectSchema = v.object({
	integrations: v.record(v.string(), ProjectIntegrationSchema),
	nodes: v.array(ProjectNodeSchema),
});

export type ProjectIntegration = v.InferOutput<typeof ProjectIntegrationSchema>;
export type Project = v.InferOutput<typeof ProjectSchema>;

export type ProjectNode = v.InferOutput<typeof ProjectNodeSchema>;
export type ProjectNodeEntry = v.InferOutput<typeof ProjectNodeEntrySchema>;
