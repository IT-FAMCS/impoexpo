import { boolean, number, object, optional, string } from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-utils";

export const COMBINE_STRINGS_NODE = new BaseNode({
	category: "string",
	name: "combine",
	inputSchema: object({
		stringA: string(),
		stringB: string(),
	}),
	outputSchema: object({
		out: string(),
	}),
});

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

export const BOOLEAN_TO_STRING_NODE = new BaseNode({
	category: "string",
	name: "boolean-to-string",
	inputSchema: object({
		boolean: boolean(),
		trueValue: optional(string(), "true"),
		falseValue: optional(string(), "false"),
	}),
	outputSchema: object({
		out: string(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		COMBINE_STRINGS_NODE,
		REPLACE_NODE,
		CONTAINS_NODE,
		LENGTH_NODE,
		NUMBER_TO_STRING_NODE,
		BOOLEAN_TO_STRING_NODE,
	);
});
