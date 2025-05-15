import { BaseNode } from "../../node-types";
import { nodesScope } from "../../node-database";
import { registerBaseNodes } from "../../node-database";
import * as v from "valibot";
import type { MicrosoftOfficeDocumentLayout } from "../../../schemas/integrations/microsoft/MicrosoftOfficeLayoutSchema";
import {
	customType,
	registerCustomType,
	schemaFromString,
} from "../../schema-string-conversions";
import { generic } from "../../node-utils";

registerCustomType("WordRun", () => ({
	type: generic("T"),
	native: v.unknown(),
}));

export const WORD_TEXT_NODE = new BaseNode({
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
		run: customType("WordRun"),
	}),
});

export const WORD_LIST_NODE = new BaseNode({
	category: "microsoft-word",
	name: "list",
	inputSchema: v.object({
		runs: v.array(customType("WordRun")),
	}),
	outputSchema: v.object({
		run: customType("WordRun"),
	}),
});

export const WORD_GROUPED_LIST_NODE = new BaseNode({
	category: "microsoft-word",
	name: "grouped-list",
	inputSchema: v.object({
		groupBy: v.string(),
		runs: v.array(customType("WordRun")),
	}),
	outputSchema: v.object({
		run: customType("WordRun"),
	}),
});

export const createWordDocumentBaseNode = (
	filename: string,
	layout: MicrosoftOfficeDocumentLayout,
) => {
	const entries: v.ObjectEntries = {};
	for (const placeholder of layout.placeholders)
		entries[placeholder.formattedName] = schemaFromString(
			`WordRun<${placeholder.type}>`,
		);

	return new BaseNode({
		category: "microsoft-word",
		name: `document-${filename}`,
		inputSchema: v.object(entries),
	});
};

nodesScope(() => {
	registerBaseNodes(WORD_TEXT_NODE, WORD_LIST_NODE, WORD_GROUPED_LIST_NODE);
});
