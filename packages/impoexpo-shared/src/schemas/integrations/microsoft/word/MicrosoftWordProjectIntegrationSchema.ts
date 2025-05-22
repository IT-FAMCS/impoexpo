import * as v from "valibot";
import { MicrosoftWordDocumentLayoutSchema } from "./MicrosoftWordLayoutSchema";

export const MicrosoftWordProjectIntegrationSchema = v.object({
	data: v.object({
		documents: v.array(
			v.object({
				layout: MicrosoftWordDocumentLayoutSchema,
				filename: v.string(),
				clientIdentifier: v.string(),
			}),
		),
	}),
	files: v.array(v.string()),
});

export type MicrosoftWordProjectIntegration = v.InferOutput<
	typeof MicrosoftWordProjectIntegrationSchema
>;
