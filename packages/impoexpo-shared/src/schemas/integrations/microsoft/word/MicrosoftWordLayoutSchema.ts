import * as v from "valibot";

export const MicrosoftWordDocumentPlaceholderSchema = v.object({
	raw: v.string(),
	name: v.string(),
	description: v.nullable(v.string()),
	type: v.string(),
});

export const MicrosoftWordDocumentLayoutSchema = v.object({
	placeholders: v.array(MicrosoftWordDocumentPlaceholderSchema),
});

export type MicrosoftWordDocumentPlaceholder = v.InferOutput<
	typeof MicrosoftWordDocumentPlaceholderSchema
>;
export type MicrosoftWordDocumentLayout = v.InferOutput<
	typeof MicrosoftWordDocumentLayoutSchema
>;
