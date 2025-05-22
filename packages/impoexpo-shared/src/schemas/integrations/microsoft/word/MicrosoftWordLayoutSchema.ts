import * as v from "valibot";

export enum MicrosoftWordPlaceholderType {
	TEXT = 0,
	LIST = 1,
	GROUPED_LIST = 2,
}

export const MicrosoftWordDocumentPlaceholderSchema = v.object({
	raw: v.string(),
	name: v.string(),
	description: v.nullable(v.string()),
	type: v.enum(MicrosoftWordPlaceholderType),
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
