import { number, object } from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-utils";

const binaryNode = (name: string) =>
	new BaseNode({
		name: name,
		category: "math",
		inputSchema: object({
			inA: number(),
			inB: number(),
		}),
		outputSchema: object({
			out: number(),
		}),
	});

const unaryNode = (name: string) =>
	new BaseNode({
		name: name,
		category: "math",
		inputSchema: object({
			in: number(),
		}),
		outputSchema: object({
			out: number(),
		}),
	});

export const ADD_NODE = binaryNode("add");
export const SUBTRACT_NODE = binaryNode("subtract");
export const MULTIPLY_NODE = binaryNode("multiply");
export const DIVIDE_NODE = binaryNode("divide");
export const MODULO_NODE = binaryNode("modulo");
export const POWER_NODE = binaryNode("power");

export const SQUARE_ROOT_NODE = unaryNode("square-root");
export const ABS_NODE = unaryNode("abs");
export const NEGATE_NODE = unaryNode("negate");
export const LOG_NODE = unaryNode("log");

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
