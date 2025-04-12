import {
	object,
	string,
	enum_,
	picklist,
	optional,
	pipe,
	minLength,
	minValue,
	maxValue,
	number,
	boolean,
} from "valibot";
import { nodesScope } from "../node-database";
import { registerBaseNodes } from "../node-database";
import { BaseNode } from "../node-types";

export const CONSOLE_WRITE_NODE = new BaseNode({
	name: "write",
	category: "console",
	inputSchema: object({
		text: string(),
	}),
});

export const TESTING_INPUT_NODE = new BaseNode({
	name: "test-in",
	category: "console",
	inputSchema: object({
		choice: optional(picklist(["test", "test2", "test3"]), "test"),
		choiceEnum: enum_({ meow: "MEOW", bark: "BARK" }),
		str: pipe(string(), minLength(5)),
		num: optional(pipe(number(), minValue(50), maxValue(300)), 100),
		bool: boolean(),
		boolOptional: optional(boolean(), true),
	}),
});

export const TESTING_OUTPUT_NODE = new BaseNode({
	name: "test-out",
	category: "console",
	outputSchema: object({
		strOut: string(),
		numOut: number(),
		boolOut: boolean(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		CONSOLE_WRITE_NODE,
		TESTING_INPUT_NODE,
		TESTING_OUTPUT_NODE,
	);
});
