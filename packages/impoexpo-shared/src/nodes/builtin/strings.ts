import { BaseNode } from "../node-types";
import { nodesScope } from "../node-database";
import { registerBaseNodes } from "../node-database";
import * as v from "valibot";

export const REPLACE_NODE = new BaseNode({
	category: "string",
	name: "replace",
	inputSchema: v.object({
		string: v.string(),
		pattern: v.string(),
		replacement: v.string(),
	}),
	outputSchema: v.object({
		result: v.string(),
	}),
});

export const CONTAINS_NODE = new BaseNode({
	category: "string",
	name: "contains",
	inputSchema: v.object({
		string: v.string(),
		pattern: v.string(),
	}),
	outputSchema: v.object({
		result: v.boolean(),
	}),
});

export const LENGTH_NODE = new BaseNode({
	category: "string",
	name: "length",
	inputSchema: v.object({
		string: v.string(),
	}),
	outputSchema: v.object({
		length: v.number(),
	}),
});

export const JOIN_STRINGS_NODE = new BaseNode({
	category: "string",
	name: "join",
	inputSchema: v.object({
		stringA: v.string(),
		stringB: v.string(),
		delimiter: v.optional(v.string(), ""),
	}),
	outputSchema: v.object({
		result: v.string(),
	}),
});

export const NUMBER_TO_STRING_NODE = new BaseNode({
	category: "string",
	name: "number-to-string",
	inputSchema: v.object({
		number: v.number(),
	}),
	outputSchema: v.object({
		string: v.string(),
	}),
});

export const STRING_TO_NUMBER_NODE = new BaseNode({
	category: "string",
	name: "string-to-number",
	inputSchema: v.object({
		string: v.string(),
	}),
	outputSchema: v.object({
		number: v.nullable(v.number()),
	}),
});

export const SPLIT_STRING_NODE = new BaseNode({
	category: "string",
	name: "split-string",
	inputSchema: v.object({
		string: v.string(),
		delimiter: v.string(),
	}),
	outputSchema: v.object({
		parts: v.array(v.string()),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		REPLACE_NODE,
		CONTAINS_NODE,
		LENGTH_NODE,
		JOIN_STRINGS_NODE,
		NUMBER_TO_STRING_NODE,
		STRING_TO_NUMBER_NODE,
		SPLIT_STRING_NODE,
	);
});
