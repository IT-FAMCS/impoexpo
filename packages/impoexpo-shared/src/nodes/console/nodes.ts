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
} from "valibot";
import { nodesScope, registerBaseNodes } from "../node-utils";
import { BaseNode } from "../node-types";

export namespace nodes.base.console {
	export const CONSOLE_WRITE_NODE = new BaseNode({
		name: "write",
		category: "console",
		inputSchema: object({
			text: string(),
		}),
	});

	export const TESTING_NODE = new BaseNode({
		name: "test",
		category: "console",
		inputSchema: object({
			choice: optional(picklist(["test", "test2", "test3"]), "test"),
			choiceEnum: enum_({ meow: "MEOW", bark: "BARK" }),
			str: pipe(string(), minLength(5)),
			num: optional(pipe(number(), minValue(50), maxValue(300)), 100),
		}),
		independentInputs: ["choice", "choiceEnum"],
	});

	nodesScope(() => {
		registerBaseNodes(true, CONSOLE_WRITE_NODE);
		registerBaseNodes(false, TESTING_NODE);
	});
}
