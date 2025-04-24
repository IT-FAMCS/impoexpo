import { nodesScope, registerBaseNodes } from "../node-database";
import { BaseNode } from "../node-types";
import * as v from "valibot";

export const NUMBER_NODE = new BaseNode({
	category: "literals",
	name: "number",
	purpose: "generator",
	inputSchema: v.object({
		in: v.number(),
	}),
	outputSchema: v.object({
		out: v.number(),
	}),
});

export const STRING_NODE = new BaseNode({
	category: "literals",
	name: "string",
	purpose: "generator",
	inputSchema: v.object({
		in: v.string(),
	}),
	outputSchema: v.object({
		out: v.string(),
	}),
});

export const BOOLEAN_NODE = new BaseNode({
	category: "literals",
	name: "boolean",
	purpose: "generator",
	inputSchema: v.object({
		in: v.boolean(),
	}),
	outputSchema: v.object({
		out: v.boolean(),
	}),
});

nodesScope(() => {
	registerBaseNodes(NUMBER_NODE, STRING_NODE, BOOLEAN_NODE);
});
