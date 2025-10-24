import * as v from "valibot";

export const ProjectNodeEntrySchema = v.object({
	type: v.picklist(["independent", "dependent"]),
	sources: v.optional(
		v.array(v.object({ node: v.string(), entry: v.string() })),
	),
	errorBehavior: v.optional(
		v.object({
			message: v.string(),
			skipIterationInsideLoops: v.boolean(),
		}),
	),
	arrayType: v.optional(v.string()),
	value: v.optional(v.unknown()),
});

export const ProjectNodeSchema = v.object({
	id: v.pipe(v.string(), v.nonEmpty()),
	type: v.pipe(v.string(), v.nonEmpty()),
	inputs: v.record(v.string(), ProjectNodeEntrySchema),
	outputs: v.record(v.string(), ProjectNodeEntrySchema),
	generics: v.optional(
		v.object({
			base: v.string(),
			name: v.string(),
			resolvedTypes: v.record(v.string(), v.nullable(v.string())),
		}),
	),
});

export const ProjectIntegrationSchema = v.object({
	auth: v.optional(v.record(v.string(), v.unknown())),
	data: v.optional(v.record(v.string(), v.unknown())),
	files: v.optional(v.array(v.string())),
});

export const ProjectSchema = v.object({
	integrations: v.record(v.string(), ProjectIntegrationSchema),
	nodes: v.array(ProjectNodeSchema),
});

// TODO: other output types?
export const ProjectOutputSchema = v.variant("type", [
	v.object({
		type: v.literal("file"),
		name: v.string(),
		mimeType: v.string(),
		identifier: v.string(),
		ttl: v.number(),
		size: v.number(),
	}),
]);

export type ProjectIntegration = v.InferOutput<typeof ProjectIntegrationSchema>;
export type Project = v.InferOutput<typeof ProjectSchema>;

export type ProjectNode = v.InferOutput<typeof ProjectNodeSchema>;
export type ProjectNodeEntry = v.InferOutput<typeof ProjectNodeEntrySchema>;
export type ProjectOutput = v.InferOutput<typeof ProjectOutputSchema>;
