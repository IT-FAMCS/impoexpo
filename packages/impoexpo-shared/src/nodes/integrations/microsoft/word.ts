import { BaseNode, type ObjectEntry } from "../../node-types";
import { nodesScope } from "../../node-database";
import { registerBaseNodes } from "../../node-database";
import * as v from "valibot";
import { registerCustomType } from "../../schema-string-conversions";
import {
	type MicrosoftWordDocumentLayout,
	MicrosoftWordPatchSchema,
	MicrosoftWordPlaceholderType,
} from "../../../schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";

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
		integration: true,
		inputSchema: v.object(entries),
	});
};

nodesScope(() => {
	registerBaseNodes(WORD_TEXT_NODE, WORD_LIST_NODE, WORD_GROUPED_LIST_NODE);
});
