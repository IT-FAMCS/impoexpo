import * as v from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-database";
import { generic } from "../node-utils";

export const IF_NODE = new BaseNode({
	category: "conditional",
	name: "if",
	inputSchema: v.object({
		condition: v.boolean(),
		trueValue: generic("T"),
		falseValue: generic("T"),
	}),
	outputSchema: v.object({
		value: generic("T"),
	}),
});

export const REPEAT_NODE = new BaseNode({
	category: "conditional",
	name: "repeat",
	inputSchema: v.object({
		times: v.number(),
	}),
	outputSchema: v.object({
		iteration: v.pipe(v.number()),
	}),
	iterable: true,
});

export const THROW_ERROR_IF_NULL_NODE = new BaseNode({
	category: "conditional",
	name: "throw-error-if-null",
	inputSchema: v.object({
		nullableObject: v.nullable(generic("T")),
		errorMessage: v.pipe(v.string(), v.nonEmpty()),
	}),
	outputSchema: v.object({
		object: generic("T"),
	}),
});

export const SKIP_ITERATION_IF_NODE = new BaseNode({
	category: "conditional",
	name: "skip-iteration-if",
	inputSchema: v.object({
		condition: v.boolean(),
		obj: generic("T"),
	}),
	outputSchema: v.object({
		sameObj: generic("T"),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		IF_NODE,
		REPEAT_NODE,
		THROW_ERROR_IF_NULL_NODE,
		SKIP_ITERATION_IF_NODE,
	);
});
