import { nodesScope, registerBaseNodes } from "../node-database";
import { BaseNode } from "../node-types";
import * as v from "valibot";
import { dateTime, generic } from "../node-utils";
import { registerConverter } from "../type-converters";

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

export const DATE_TIME_NODE = new BaseNode({
	category: "literals",
	name: "date-time",
	inputSchema: v.object({
		value: dateTime(),
	}),
	outputSchema: v.object({
		dateTime: dateTime(),
	}),
});

export const ARRAY_NODE = new BaseNode({
	category: "literals",
	name: "array",
	inputSchema: v.object({
		value: v.array(generic("T")),
	}),
	outputSchema: v.object({
		array: v.array(generic("T")),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		NUMBER_NODE,
		STRING_NODE,
		BOOLEAN_NODE,
		DATE_TIME_NODE,
		ARRAY_NODE,
	);
	registerConverter(v.boolean(), v.string(), (obj) => (obj ? "true" : "false"));
});
