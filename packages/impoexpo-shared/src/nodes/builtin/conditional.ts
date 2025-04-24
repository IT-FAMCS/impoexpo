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
		out: generic("T"),
	}),
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

nodesScope(() => {
	registerBaseNodes(IF_NODE, THROW_ERROR_IF_NULL_NODE);
});
