import { boolean, number, object, optional, string } from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope } from "../node-database";
import { registerBaseNodes } from "../node-database";

export const REPLACE_NODE = new BaseNode({
	category: "string",
	name: "replace",
	inputSchema: object({
		string: string(),
		pattern: string(),
		replacement: string(),
	}),
	outputSchema: object({
		out: string(),
	}),
});

export const CONTAINS_NODE = new BaseNode({
	category: "string",
	name: "contains",
	inputSchema: object({
		string: string(),
		pattern: string(),
	}),
	outputSchema: object({
		out: boolean(),
	}),
});

export const LENGTH_NODE = new BaseNode({
	category: "string",
	name: "length",
	inputSchema: object({
		string: string(),
	}),
	outputSchema: object({
		out: number(),
	}),
});

export const JOIN_STRINGS_NODE = new BaseNode({
	category: "string",
	name: "join",
	inputSchema: object({
		stringA: string(),
		stringB: string(),
		delimiter: optional(string(), ""),
	}),
	outputSchema: object({
		out: string(),
	}),
});

export const NUMBER_TO_STRING_NODE = new BaseNode({
	category: "string",
	name: "number-to-string",
	inputSchema: object({
		number: number(),
	}),
	outputSchema: object({
		out: string(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		REPLACE_NODE,
		CONTAINS_NODE,
		LENGTH_NODE,
		JOIN_STRINGS_NODE,
		NUMBER_TO_STRING_NODE,
	);
});
