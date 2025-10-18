import { number } from "valibot";
import { nodesScope } from "../node-database";
import { registerBaseNodes } from "../node-database";
import { binaryNode, unaryNode } from "../common";
import { BaseNode } from "../node-types";
import * as v from "valibot";
import { registerConverter } from "../type-converters";

export const ADD_NODE = binaryNode("math", "add", number);
export const SUBTRACT_NODE = binaryNode("math", "subtract", number);
export const MULTIPLY_NODE = binaryNode("math", "multiply", number);
export const DIVIDE_NODE = binaryNode("math", "divide", number);
export const MODULO_NODE = binaryNode("math", "modulo", number);
export const POWER_NODE = binaryNode("math", "power", number);

export const SQUARE_ROOT_NODE = unaryNode("math", "square-root", number);
export const ABS_NODE = unaryNode("math", "abs", number);
export const NEGATE_NODE = unaryNode("math", "negate", number);
export const LOG_NODE = unaryNode("math", "log", number);

export const IS_INTEGER_NODE = new BaseNode({
	category: "math",
	name: "is-integer",
	inputSchema: v.object({
		number: v.number(),
	}),
	outputSchema: v.object({
		result: v.boolean(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		ADD_NODE,
		SUBTRACT_NODE,
		MULTIPLY_NODE,
		DIVIDE_NODE,
		MODULO_NODE,
		POWER_NODE,
		SQUARE_ROOT_NODE,
		ABS_NODE,
		NEGATE_NODE,
		LOG_NODE,
		IS_INTEGER_NODE,
	);
	registerConverter(v.number(), v.string(), (obj) => obj.toString(10));
});
