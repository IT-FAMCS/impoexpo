import { BaseNode } from "../node-types";
import * as v from "valibot";
import { generic } from "../node-utils";
import { nodesScope, registerBaseNodes } from "../node-database";

export const ARRAY_LENGTH_NODE = new BaseNode({
	category: "array",
	name: "length",
	inputSchema: v.object({
		array: v.array(generic("T")),
	}),
	outputSchema: v.object({
		length: v.number(),
	}),
});

export const ARRAY_FOREACH_NODE = new BaseNode({
	category: "array",
	name: "foreach",
	inputSchema: v.object({
		array: v.array(generic("T")),
	}),
	outputSchema: v.object({
		object: generic("T"),
	}),
	iterable: true,
});

export const ARRAY_IS_FIRST_NODE = new BaseNode({
	category: "array",
	name: "is-first",
	inputSchema: v.object({
		object: generic("T"),
	}),
	outputSchema: v.object({
		first: v.boolean(),
	}),
});

export const ARRAY_IS_LAST_NODE = new BaseNode({
	category: "array",
	name: "is-last",
	inputSchema: v.object({
		object: generic("T"),
	}),
	outputSchema: v.object({
		last: v.boolean(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		ARRAY_LENGTH_NODE,
		ARRAY_FOREACH_NODE,
		ARRAY_IS_FIRST_NODE,
		ARRAY_IS_LAST_NODE,
	);
});
