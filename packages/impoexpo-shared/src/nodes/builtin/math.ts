import { number } from "valibot";
import { nodesScope } from "../node-database";
import { registerBaseNodes } from "../node-database";
import { symmetricBinaryNode, symmetricUnaryNode } from "../common";

export const ADD_NODE = symmetricBinaryNode("math", "add", number);
export const SUBTRACT_NODE = symmetricBinaryNode("math", "subtract", number);
export const MULTIPLY_NODE = symmetricBinaryNode("math", "multiply", number);
export const DIVIDE_NODE = symmetricBinaryNode("math", "divide", number);
export const MODULO_NODE = symmetricBinaryNode("math", "modulo", number);
export const POWER_NODE = symmetricBinaryNode("math", "power", number);

export const SQUARE_ROOT_NODE = symmetricUnaryNode(
	"math",
	"square-root",
	number,
);
export const ABS_NODE = symmetricUnaryNode("math", "abs", number);
export const NEGATE_NODE = symmetricUnaryNode("math", "negate", number);
export const LOG_NODE = symmetricUnaryNode("math", "log", number);

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
	);
});
