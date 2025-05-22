import { BaseNode, type ObjectEntry } from "../../node-types";
import { nodesScope } from "../../node-database";
import { registerBaseNodes } from "../../node-database";
import * as v from "valibot";
import { registerCustomType } from "../../schema-string-conversions";
import {
	type MicrosoftWordDocumentLayout,
	MicrosoftWordPlaceholderType,
} from "../../../schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";

const WordTextSchema = registerCustomType(
	"WordText",
	() =>
		({
			text: v.string(),
		}) satisfies v.ObjectEntries,
);
export type WordText = v.InferOutput<typeof WordTextSchema>;

const WordListSchema = registerCustomType(
	"WordList",
	() =>
		({
			items: WordTextSchema,
		}) satisfies v.ObjectEntries,
);
export type WordList = v.InferOutput<typeof WordListSchema>;

const WordGroupedListSchema = registerCustomType(
	"WordGroupedList",
	() =>
		({
			groups: v.array(
				v.object({
					title: WordTextSchema,
					items: WordListSchema,
				}),
			),
		}) satisfies v.ObjectEntries,
);
export type WordGroupedList = v.InferOutput<typeof WordListSchema>;

export const WORD_TEXT_NODE = new BaseNode({
	category: "microsoft-word",
	name: "text",
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
	inputSchema: v.object({
		items: v.array(WordTextSchema),
	}),
	outputSchema: v.object({
		result: WordListSchema,
	}),
});

export const WORD_GROUPED_LIST_NODE = new BaseNode({
	category: "microsoft-word",
	name: "grouped-list",
	inputSchema: v.object({
		groupBy: v.string(),
		title: WordTextSchema,
		items: WordListSchema,
	}),
	outputSchema: v.object({
		result: WordGroupedListSchema,
	}),
});

const typeToEntry: Record<MicrosoftWordPlaceholderType, ObjectEntry> = {
	[MicrosoftWordPlaceholderType.TEXT]: WordTextSchema,
	[MicrosoftWordPlaceholderType.LIST]: WordListSchema,
	[MicrosoftWordPlaceholderType.GROUPED_LIST]: WordGroupedListSchema,
};

export const createWordDocumentBaseNode = (
	identifier: string,
	layout: MicrosoftWordDocumentLayout,
) => {
	const entries: v.ObjectEntries = {};
	for (const placeholder of layout.placeholders)
		entries[placeholder.name] = typeToEntry[placeholder.type];

	return new BaseNode({
		category: "microsoft-word",
		name: `document-${identifier}`,
		inputSchema: v.object(entries),
	});
};

nodesScope(() => {
	registerBaseNodes(WORD_TEXT_NODE, WORD_LIST_NODE, WORD_GROUPED_LIST_NODE);
});
