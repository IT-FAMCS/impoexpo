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

nodesScope(() => {
	registerBaseNodes(ARRAY_LENGTH_NODE, ARRAY_FOREACH_NODE);
});
