import * as v from "valibot";
import { GoogleFormsLayoutSchema } from "./GoogleFormsLayoutSchema";

export const GoogleFormsProjectIntegrationSchema = v.object({
	auth: v.object({
		tokens: v.pipe(v.string(), v.nonEmpty()),
	}),
	data: v.object({
		forms: v.record(v.string(), GoogleFormsLayoutSchema),
	}),
});

export type GoogleFormsProjectIntegration = v.InferOutput<
	typeof GoogleFormsProjectIntegrationSchema
>;
