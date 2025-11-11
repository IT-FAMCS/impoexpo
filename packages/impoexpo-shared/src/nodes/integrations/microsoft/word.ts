import * as v from "valibot";
import {
	type MicrosoftWordDocumentLayout,
	type MicrosoftWordDocumentPlaceholder,
	MicrosoftWordPatchSchema,
	MicrosoftWordPlaceholderType,
} from "../../../schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import { nodesScope, registerBaseNodes } from "../../node-database";
import { BaseNode, type ObjectEntry } from "../../node-types";
import {
	type customType,
	dateTime,
	type DefaultBaseNode,
	getCustomTypeName,
} from "../../node-utils";
import { registerCustomType } from "../../schema-string-conversions";

export const WordTextSchema = registerCustomType(
	"WordText",
	() => MicrosoftWordPatchSchema.options["0"].entries,
);
export const WordListSchema = registerCustomType(
	"WordList",
	() => MicrosoftWordPatchSchema.options["1"].entries,
);
export const WordGroupedListSchema = registerCustomType(
	"WordGroupedList",
	() => MicrosoftWordPatchSchema.options["2"].entries,
);

export const WordPatchSchema = v.union([
	WordTextSchema,
	WordListSchema,
	WordGroupedListSchema,
]);

export const WordSorterSchema = registerCustomType("WordSorter", () => ({
	method: v.picklist(["numbers", "text", "dates"]),
	keys: v.array(v.array(v.unknown())),
	reverse: v.optional(v.boolean(), false),
}));
export type WordSorter = v.InferOutput<typeof WordSorterSchema>;

export const WORD_TEXT_SORTER_NODE = new BaseNode({
	category: "microsoft-word",
	name: "sorter-text",
	integration: true,
	inputSchema: v.object({
		reverse: v.optional(v.boolean(), false),
		keys: v.array(v.string()),
	}),
	outputSchema: v.object({
		sorter: WordSorterSchema,
	}),
});

export const WORD_NUMBERS_SORTER_NODE = new BaseNode({
	category: "microsoft-word",
	name: "sorter-numbers",
	integration: true,
	inputSchema: v.object({
		reverse: v.optional(v.boolean(), false),
		keys: v.array(v.number()),
	}),
	outputSchema: v.object({
		sorter: WordSorterSchema,
	}),
});

export const WORD_DATES_SORTER_NODE = new BaseNode({
	category: "microsoft-word",
	name: "sorter-dates",
	integration: true,
	inputSchema: v.object({
		reverse: v.optional(v.boolean(), false),
		keys: v.array(dateTime()),
	}),
	outputSchema: v.object({
		sorter: WordSorterSchema,
	}),
});

nodesScope(() => {
	registerBaseNodes(
		WORD_TEXT_SORTER_NODE,
		WORD_NUMBERS_SORTER_NODE,
		WORD_DATES_SORTER_NODE,
	);
});

export const createWordDocumentBaseNode = (
	identifier: string,
	layout: MicrosoftWordDocumentLayout,
) => {
	const data: {
		placeholders: Record<
			string,
			{
				node?: DefaultBaseNode;
				schema: ReturnType<typeof customType>;
				parent: string;
				layout: MicrosoftWordDocumentPlaceholder;
			}
		>;
		document?: DefaultBaseNode;
	} = {
		placeholders: {},
	};
	const createEntry = (placeholder: MicrosoftWordDocumentPlaceholder) => {
		switch (placeholder.type) {
			case MicrosoftWordPlaceholderType.TEXT: {
				const type = registerCustomType(
					`${placeholder.name}_${placeholder.type}_${identifier}`,
					() => MicrosoftWordPatchSchema.options["0"].entries,
				);
				data.placeholders[placeholder.name] = {
					schema: type,
					layout: placeholder,
					node: new BaseNode({
						category: "microsoft-word",
						name: getCustomTypeName(type),
						integration: true,
						inputSchema: v.object({
							text: v.string(),
						}),
						outputSchema: v.object({
							result: type,
						}),
					}),
					parent: "",
				};
				return placeholder.name;
			}
			case MicrosoftWordPlaceholderType.LIST: {
				const type = registerCustomType(
					`${placeholder.name}_${placeholder.type}_${identifier}`,
					() => MicrosoftWordPatchSchema.options["1"].entries,
				);
				data.placeholders[placeholder.name] = {
					parent: "",
					schema: type,
					layout: placeholder,
				};
				const items = placeholder.children
					.map((c) => createEntry(c))
					.reduce(
						(acc, cur) => {
							acc[cur] = data.placeholders[cur].schema;
							data.placeholders[cur].parent = placeholder.name;
							return acc;
						},
						{} as Record<string, ObjectEntry>,
					);
				data.placeholders[placeholder.name].node = new BaseNode({
					category: "microsoft-word",
					name: getCustomTypeName(type),
					integration: true,
					inputSchema: v.object({
						...items,
						__sorter: v.optional(WordSorterSchema),
						__automaticSeparators: v.optional(v.boolean(), false),
					}),
					outputSchema: v.object({
						result: type,
					}),
				});

				return placeholder.name;
			}
			case MicrosoftWordPlaceholderType.GROUP: {
				const type = registerCustomType(
					`${placeholder.name}_${placeholder.type}_${identifier}`,
					() => MicrosoftWordPatchSchema.options["2"].entries,
				);
				data.placeholders[placeholder.name] = {
					parent: "",
					schema: type,
					layout: placeholder,
				};
				const items = placeholder.children
					.map((c) => createEntry(c))
					.reduce(
						(acc, cur) => {
							if (cur) {
								acc[cur] = data.placeholders[cur].schema;
								data.placeholders[cur].parent = placeholder.name;
							}
							return acc;
						},
						{} as Record<string, ObjectEntry>,
					);
				data.placeholders[placeholder.name].node = new BaseNode({
					category: "microsoft-word",
					name: getCustomTypeName(type),
					integration: true,
					inputSchema: v.object({
						...items,
						__sorter: v.optional(WordSorterSchema),
						__title: v.optional(v.string(), ""),
					}),
					outputSchema: v.object({
						result: type,
					}),
				});
				return placeholder.name;
			}
		}
	};

	const entries: Record<
		string,
		ReturnType<typeof customType>
	> = layout.placeholders.reduce(
		(acc, cur) => {
			acc[cur.name] = data.placeholders[createEntry(cur)].schema;
			return acc;
		},
		{} as Record<string, ReturnType<typeof customType>>,
	);

	data.document = new BaseNode({
		category: "microsoft-word",
		name: `document-${identifier}`,
		integration: true,
		inputSchema: v.object(entries),
	});

	return data as {
		document: BaseNode<v.ObjectEntries>;
		placeholders: Record<
			string,
			Required<(typeof data)["placeholders"][string]>
		>;
	};
};
