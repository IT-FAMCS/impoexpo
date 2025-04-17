import * as v from "valibot";

export const GoogleFormsProjectIntegrationSchema = v.object({
	auth: v.object({
		hash: v.pipe(v.string(), v.nonEmpty()),
	}),
	data: v.object({
		forms: v.array(v.string()),
	}),
});

export type GoogleFormsProjectIntegration = v.InferOutput<
	typeof GoogleFormsProjectIntegrationSchema
>;
