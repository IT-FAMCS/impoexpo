import * as v from "valibot";

export const MicrosoftOfficeDocumentPlaceholderSchema = v.object({
	originalName: v.string(),
	formattedName: v.string(),
	type: v.string(),
	description: v.nullable(v.string()),
});

export const MicrosoftOfficeDocumentLayoutSchema = v.object({
	placeholders: v.array(MicrosoftOfficeDocumentPlaceholderSchema),
});

export type MicrosoftOfficeDocumentPlaceholder = v.InferOutput<
	typeof MicrosoftOfficeDocumentPlaceholderSchema
>;
export type MicrosoftOfficeDocumentLayout = v.InferOutput<
	typeof MicrosoftOfficeDocumentLayoutSchema
>;
