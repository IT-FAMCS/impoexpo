import {
	boolean,
	nonEmpty,
	nullable,
	object,
	optional,
	pipe,
	string,
} from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-database";
import { generic, named } from "../node-utils";

export const IF_NODE = new BaseNode({
	category: "conditional",
	name: "if",
	inputSchema: object({
		condition: boolean(),
		trueValue: generic("T"),
		falseValue: generic("T"),
	}),
	outputSchema: object({
		out: generic("T"),
	}),
});

export const THROW_ERROR_IF_NULL_NODE = new BaseNode({
	category: "conditional",
	name: "throw-error-if-null",
	inputSchema: object({
		nullableObject: nullable(generic("T")),
		errorMessage: pipe(string(), nonEmpty()),
	}),
	outputSchema: object({
		object: generic("T"),
	}),
});

nodesScope(() => {
	registerBaseNodes(IF_NODE, THROW_ERROR_IF_NULL_NODE);
});
