import * as v from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-database";
import { generic } from "../node-utils";
import {
	binaryNode,
	binaryNodeWithDifferentOutput,
	unaryNode,
} from "../common";

export const EQUAL_NODE = new BaseNode({
	category: "operators",
	name: "equal",
	inputSchema: v.object({
		inA: generic("T"),
		inB: generic("T"),
	}),
	outputSchema: v.object({
		out: v.boolean(),
	}),
});

export const NOT_NODE = unaryNode("operators", "not", v.boolean);
export const AND_NODE = binaryNode("operators", "and", v.boolean);
export const OR_NODE = binaryNode("operators", "or", v.boolean);

export const LESS_THAN_NODE = binaryNodeWithDifferentOutput(
	"operators",
	"less-than",
	v.number,
	v.boolean,
);
export const LESS_OR_EQUAL_TO_NODE = binaryNodeWithDifferentOutput(
	"operators",
	"less-or-eq",
	v.number,
	v.boolean,
);
export const GREATER_THAN_NODE = binaryNodeWithDifferentOutput(
	"operators",
	"greater-than",
	v.number,
	v.boolean,
);
export const GREATER_OR_EQUAL_TO_NODE = binaryNodeWithDifferentOutput(
	"operators",
	"greater-or-eq",
	v.number,
	v.boolean,
);

nodesScope(() => {
	registerBaseNodes(
		EQUAL_NODE,
		NOT_NODE,
		AND_NODE,
		OR_NODE,

		LESS_THAN_NODE,
		LESS_OR_EQUAL_TO_NODE,
		GREATER_THAN_NODE,
		GREATER_OR_EQUAL_TO_NODE,
	);
});
