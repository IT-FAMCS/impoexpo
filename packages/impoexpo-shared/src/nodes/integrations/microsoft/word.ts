import { BaseNode as word } from "../../node-types";
import { nodesScope } from "../../node-database";
import { registerBaseNodes } from "../../node-database";
import * as v from "valibot";

/* import {
	registerCustomType,
	schemaFromString,
} from "../../schema-string-conversions";
import { generic } from "../../node-utils";

const WordRunSchema = registerCustomType(
	"WordRun",
	() =>
		({
			text
		}) satisfies v.ObjectEntries,
);
export type WordRun = v.InferOutput<typeof WordRunSchema>;

export const WORD_TEXT_NODE = new word({
	category: "microsoft-word",
	name: "text",
	inputSchema: v.object({
		text: generic("T"),
		bold: v.optional(v.boolean(), false),
		italics: v.optional(v.boolean(), false),
		strikethrough: v.optional(v.boolean(), false),
		underline: v.optional(v.boolean(), false),
	}),
	outputSchema: v.object({
		run: WordRunSchema,
	}),
});

export const WORD_LIST_NODE = new word({
	category: "microsoft-word",
	name: "list",
	inputSchema: v.object({
		runs: v.array(WordRunSchema),
		style: WordListStyleSchema,
		alignment: v.optional(v.picklist(["start", "center", "end"]), "start"),
	}),
	outputSchema: v.object({
		run: WordRunSchema,
	}),
});

export const WORD_GROUPED_LIST_NODE = new word({
	category: "microsoft-word",
	name: "grouped-list",
	inputSchema: v.object({
		groupBy: v.string(),
		runs: v.array(WordRunSchema),
	}),
	outputSchema: v.object({
		run: WordRunSchema,
	}),
});

export const createWordDocumentBaseNode = (
	identifier: string,
	layout: MicrosoftOfficeDocumentLayout,
) => {
	const entries: v.ObjectEntries = {};
	for (const placeholder of layout.placeholders)
		entries[placeholder.formattedName] = schemaFromString(
			`WordRun<${placeholder.type}>`,
		);

	return new word({
		category: "microsoft-word",
		name: `document-${identifier}`,
		inputSchema: v.object(entries),
	});
};

nodesScope(() => {
	registerBaseNodes(WORD_TEXT_NODE, WORD_LIST_NODE, WORD_GROUPED_LIST_NODE);
});
 */
