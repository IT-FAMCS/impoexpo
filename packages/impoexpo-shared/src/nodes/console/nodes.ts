import {
	object,
	string,
	enum_,
	picklist,
	optional,
	pipe,
	minLength,
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
			choice: optional(picklist(["test", "test2", "test3"] as const), "test"),
			choiceEnum: enum_({ meow: "MEOW", bark: "BARK" } as const),
			str: pipe(string(), minLength(5)),
		}),
		independentInputs: ["choice"],
	});

	nodesScope(() => {
		registerBaseNodes(true, CONSOLE_WRITE_NODE);
		registerBaseNodes(false, TESTING_NODE);
	});
}
