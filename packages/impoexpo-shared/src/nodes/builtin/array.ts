import { BaseNode } from "../node-types";
import * as v from "valibot";
import { flow, generic, subflowArgument } from "../node-utils";
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
		flow: flow(),
		object: v.pipe(generic("T"), subflowArgument()),
	}),
});

export const ARRAY_TRANSFORM_NODE = new BaseNode({
	category: "array",
	name: "transform",
	inputSchema: v.object({
		array: v.array(generic("TIn")),
	}),
	outputSchema: v.object({
		flow: flow(),
		object: v.pipe(generic("TIn"), subflowArgument()),
		result: v.array(generic("TOut")),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		ARRAY_LENGTH_NODE,
		ARRAY_FOREACH_NODE,
		ARRAY_TRANSFORM_NODE,
	);
});
