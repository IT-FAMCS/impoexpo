import { BaseNode } from "../../node-types";
import { nodesScope } from "../../node-database";
import { registerBaseNodes } from "../../node-database";
import * as v from "valibot";
import { named } from "../../node-utils";
import type { MicrosoftOfficeDocumentLayout } from "../../../schemas/integrations/microsoft/MicrosoftOfficeLayoutSchema";
import { schemaFromString } from "../../schema-string-conversions";

const wordRun = () => named("WordRun", v.unknown());

export const WORD_TEXT_NODE = new BaseNode({
	category: "microsoft-word",
	name: "text",
	inputSchema: v.object({
		text: v.string(),
		bold: v.optional(v.boolean(), false),
		italics: v.optional(v.boolean(), false),
		strikethrough: v.optional(v.boolean(), false),
		underline: v.optional(v.boolean(), false),
	}),
	outputSchema: v.object({
		// TODO: currently, this skips some type checks, but it would probably be better to actually
		// handle this in the future
		run: wordRun(),
	}),
});

export const WORD_LIST_NODE = new BaseNode({
	category: "microsoft-word",
	name: "list",
	inputSchema: v.object({
		runs: v.array(wordRun()),
	}),
	outputSchema: v.object({
		run: wordRun(),
	}),
});

export const WORD_GROUPED_LIST_NODE = new BaseNode({
	category: "microsoft-word",
	name: "grouped-list",
	inputSchema: v.object({
		groupBy: v.string(),
		runs: v.array(wordRun()),
	}),
	outputSchema: v.object({
		run: wordRun(),
	}),
});

export const createWordDocumentBaseNode = (
	filename: string,
	layout: MicrosoftOfficeDocumentLayout,
) => {
	const entries: v.ObjectEntries = {};
	for (const placeholder of layout.placeholders)
		entries[placeholder.formattedName] = schemaFromString(placeholder.type);

	return new BaseNode({
		category: "microsoft-word",
		name: `document-${filename}`,
		inputSchema: v.object(entries),
	});
};

nodesScope(() => {
	registerBaseNodes(WORD_TEXT_NODE, WORD_LIST_NODE, WORD_GROUPED_LIST_NODE);
});
