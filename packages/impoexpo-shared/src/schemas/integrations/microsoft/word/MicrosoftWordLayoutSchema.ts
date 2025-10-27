import * as v from "valibot";

export enum MicrosoftWordPlaceholderType {
	TEXT = "Text",
	LIST = "List",
	GROUP = "Group",
}

export type MicrosoftWordTextPatch = {
	type: MicrosoftWordPlaceholderType.TEXT;
	text: string;
};
export type MicrosoftWordListPatch = {
	type: MicrosoftWordPlaceholderType.LIST;
	items: Record<string, MicrosoftWordPatch[]>;
};
export type MicrosoftWordGroupedListItem = {
	title: MicrosoftWordTextPatch;
	items: Record<string, MicrosoftWordPatch>;
};
export type MicrosoftWordGroupedListPatch = {
	type: MicrosoftWordPlaceholderType.GROUP;
	groups: MicrosoftWordGroupedListItem[];
};
export type MicrosoftWordPatch =
	| MicrosoftWordTextPatch
	| MicrosoftWordListPatch
	| MicrosoftWordGroupedListPatch;

export const MicrosoftWordPatchSchema = v.variant("type", [
	v.object({
		type: v.literal(MicrosoftWordPlaceholderType.TEXT),
		text: v.string(),
	}),
	v.object({
		type: v.literal(MicrosoftWordPlaceholderType.LIST),
		items: v.record(
			v.string(),
			v.array(
				v.lazy(
					(): v.GenericSchema<MicrosoftWordPatch> => MicrosoftWordPatchSchema,
				),
			),
		),
	}),
	v.object({
		type: v.literal(MicrosoftWordPlaceholderType.GROUP),
		groups: v.array(
			v.object({
				title: v.lazy(
					(): v.GenericSchema<MicrosoftWordTextPatch> =>
						MicrosoftWordPatchSchema.options["0"],
				),
				items: v.record(
					v.string(),
					v.lazy(
						(): v.GenericSchema<MicrosoftWordPatch> => MicrosoftWordPatchSchema,
					),
				),
			}),
		),
	}),
]);

export const MicrosoftWordDocumentPlaceholderSchema = v.object({
	raw: v.string(),
	name: v.string(),
	description: v.nullable(v.string()),
	children: v.array(
		v.lazy(
			(): v.GenericSchema<MicrosoftWordDocumentPlaceholder> =>
				MicrosoftWordDocumentPlaceholderSchema,
		),
	),
	type: v.enum(MicrosoftWordPlaceholderType),
});

export const MicrosoftWordDocumentLayoutSchema = v.object({
	placeholders: v.array(MicrosoftWordDocumentPlaceholderSchema),
});

export type MicrosoftWordDocumentPlaceholder = {
	raw: string;
	name: string;
	description: string | null;
	children: MicrosoftWordDocumentPlaceholder[];
	type: MicrosoftWordPlaceholderType;
};

export type MicrosoftWordDocumentLayout = v.InferOutput<
	typeof MicrosoftWordDocumentLayoutSchema
>;
