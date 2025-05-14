import { BaseNode } from "../../node-types";
import { nodesScope } from "../../node-database";
import { registerBaseNodes } from "../../node-database";
import * as v from "valibot";
import { named } from "../../node-utils";

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
});
