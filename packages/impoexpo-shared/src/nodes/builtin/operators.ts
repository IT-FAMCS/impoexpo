import { boolean, number, object } from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-database";
import { generic } from "../node-utils";
import { symmetricBinaryNode, symmetricUnaryNode } from "../common";

export const EQUAL_NODE = new BaseNode({
	category: "operators",
	name: "equal",
	inputSchema: object({
		inA: generic("T"),
		inB: generic("T"),
	}),
	outputSchema: object({
		out: boolean(),
	}),
});

export const NOT_NODE = symmetricUnaryNode("operators", "not", boolean);
export const AND_NODE = symmetricBinaryNode("operators", "and", boolean);
export const OR_NODE = symmetricBinaryNode("operators", "or", boolean);

export const LESS_THAN_NODE = symmetricBinaryNode(
	"operators",
	"less-than",
	number,
	boolean,
);
export const LESS_OR_EQUAL_TO_NODE = symmetricBinaryNode(
	"operators",
	"less-or-eq",
	number,
	boolean,
);
export const GREATER_THAN_NODE = symmetricBinaryNode(
	"operators",
	"greater-than",
	number,
	boolean,
);
export const GREATER_OR_EQUAL_TO_NODE = symmetricBinaryNode(
	"operators",
	"greater-or-eq",
	number,
	boolean,
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
