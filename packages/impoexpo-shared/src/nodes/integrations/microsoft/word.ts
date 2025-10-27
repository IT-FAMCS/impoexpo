import { BaseNode, type ObjectEntry } from "../../node-types";
import { nodesScope } from "../../node-database";
import { registerBaseNodes } from "../../node-database";
import * as v from "valibot";
import { registerCustomType } from "../../schema-string-conversions";
import {
	type MicrosoftWordDocumentLayout,
	MicrosoftWordDocumentPlaceholder,
	MicrosoftWordDocumentPlaceholderSchema,
	MicrosoftWordPatchSchema,
	MicrosoftWordPlaceholderType,
} from "../../../schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import { customType, DefaultBaseNode } from "../../node-utils";

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
/* export const WordPatchSchema = v.union([
	WordTextSchema,
	WordListSchema,
	WordGroupedListSchema,
]);

export const WORD_TEXT_NODE = new BaseNode({
	category: "microsoft-word",
	name: "text",
	integration: true,
	inputSchema: v.object({
		text: v.string(),
	}),
	outputSchema: v.object({
		result: WordTextSchema,
	}),
});

export const WORD_LIST_NODE = new BaseNode({
	category: "microsoft-word",
	name: "list",
	integration: true,
	inputSchema: v.object({
		sublistTitle: v.nullable(WordTextSchema),
		items: v.array(WordPatchSchema),
		automaticSeparators: v.optional(v.boolean(), false),
	}),
	outputSchema: v.object({
		result: WordListSchema,
	}),
});

export const WORD_GROUPED_LIST_NODE = new BaseNode({
	category: "microsoft-word",
	name: "grouped-list",
	integration: true,
	inputSchema: v.object({
		groups: v.map(WordTextSchema, v.array(WordPatchSchema)),
		automaticSeparators: v.optional(v.boolean(), false),
	}),
	outputSchema: v.object({
		result: WordGroupedListSchema,
	}),
});

const typeToEntry: Record<MicrosoftWordPlaceholderType, ObjectEntry> = {
	[MicrosoftWordPlaceholderType.TEXT]: WordTextSchema,
	[MicrosoftWordPlaceholderType.LIST]: WordListSchema,
	[MicrosoftWordPlaceholderType.GROUPED_LIST]: WordGroupedListSchema,
}; */

export const createWordDocumentBaseNode = (
	identifier: string,
	layout: MicrosoftWordDocumentLayout,
) => {
	const entries: v.ObjectEntries = {};
	const data: Partial<{
		connections: Record<string, string[]>;
		nodes: Record<string, DefaultBaseNode>;
		types: Record<string, ReturnType<typeof customType>>;
		document: DefaultBaseNode;
	}> = {
		connections: {},
		nodes: {},
		types: {},
	};
	const createEntry = (placeholder: MicrosoftWordDocumentPlaceholder) => {
		if (!data.nodes || !data.connections || !data.types) return;
		switch (placeholder.type) {
			case MicrosoftWordPlaceholderType.TEXT: {
				const type = registerCustomType(
					`${placeholder.name}_${placeholder.type}_${identifier}`,
					() => MicrosoftWordPatchSchema.options["0"].entries,
				);
				data.types[placeholder.name] = type;
				data.nodes[placeholder.name] = new BaseNode({
					category: "microsoft-word",
					name: placeholder.name,
					integration: true,
					inputSchema: v.object({
						text: v.string(),
					}),
					outputSchema: v.object({
						result: type,
					}),
				});
				return placeholder.name;
			}
			case MicrosoftWordPlaceholderType.LIST: {
				const type = registerCustomType(
					`${placeholder.name}_${placeholder.type}_${identifier}`,
					() => MicrosoftWordPatchSchema.options["1"].entries,
				);
				const items = placeholder.children
					.map((c) => createEntry(c))
					.reduce(
						(acc, cur) => {
							if (cur && data.types && data.connections) {
								acc[cur] = data.types[cur];
								if (!(cur in data.connections)) data.connections[cur] = [];
								data.connections[cur].push(placeholder.name);
							}
							return acc;
						},
						{} as Record<string, ObjectEntry>,
					);
				data.types[placeholder.name] = type;
				data.nodes[placeholder.name] = new BaseNode({
					category: "microsoft-word",
					name: placeholder.name,
					integration: true,
					inputSchema: v.object(items),
					outputSchema: v.object({
						result: type,
					}),
				});
				return placeholder.name;
			}
			case MicrosoftWordPlaceholderType.GROUPED_LIST: {
				const type = registerCustomType(
					`${placeholder.name}_${placeholder.type}_${identifier}`,
					() => MicrosoftWordPatchSchema.options["2"].entries,
				);
				const items = placeholder.children
					.map((c) => createEntry(c))
					.reduce(
						(acc, cur) => {
							if (cur && data.types && data.connections) {
								acc[cur] = data.types[cur];
								if (!(cur in data.connections)) data.connections[cur] = [];
								data.connections[cur].push(placeholder.name);
							}
							return acc;
						},
						{} as Record<string, ObjectEntry>,
					);
				data.types[placeholder.name] = type;
				data.nodes[placeholder.name] = new BaseNode({
					category: "microsoft-word",
					name: placeholder.name,
					integration: true,
					inputSchema: v.object({
						...items,
						// TODO: meow
					}),
					outputSchema: v.object({
						result: type,
					}),
				});
				return placeholder.name;
			}
		}
	};

	for (const placeholder of layout.placeholders) createEntry(placeholder);

	data.document = new BaseNode({
		category: "microsoft-word",
		name: `document-${identifier}`,
		integration: true,
		inputSchema: v.object(entries),
	});

	return data as Required<typeof data>;
};

nodesScope(() => {
	registerBaseNodes(WORD_TEXT_NODE, WORD_LIST_NODE, WORD_GROUPED_LIST_NODE);
});
