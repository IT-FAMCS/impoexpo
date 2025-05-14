import * as v from "valibot";
import { MicrosoftOfficeDocumentLayoutSchema } from "../MicrosoftOfficeLayoutSchema";

export const MicrosoftWordProjectIntegrationSchema = v.object({
	data: v.object({
		documents: v.array(
			v.object({
				layout: MicrosoftOfficeDocumentLayoutSchema,
				data: v.string(),
			}),
		),
	}),
});

export type MicrosoftWordProjectIntegration = v.InferOutput<
	typeof MicrosoftWordProjectIntegrationSchema
>;
