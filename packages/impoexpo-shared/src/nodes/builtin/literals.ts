import { nodesScope, registerBaseNodes } from "../node-database";
import { BaseNode } from "../node-types";
import * as v from "valibot";

export const NUMBER_NODE = new BaseNode({
	category: "literals",
	name: "number",
	inputSchema: v.object({
		value: v.number(),
	}),
	outputSchema: v.object({
		number: v.number(),
	}),
});

export const STRING_NODE = new BaseNode({
	category: "literals",
	name: "string",
	inputSchema: v.object({
		value: v.string(),
	}),
	outputSchema: v.object({
		string: v.string(),
	}),
});

export const BOOLEAN_NODE = new BaseNode({
	category: "literals",
	name: "boolean",
	inputSchema: v.object({
		value: v.boolean(),
	}),
	outputSchema: v.object({
		boolean: v.boolean(),
	}),
});

nodesScope(() => {
	registerBaseNodes(NUMBER_NODE, STRING_NODE, BOOLEAN_NODE);
});
