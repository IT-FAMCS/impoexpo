import { boolean, object, string } from "valibot";
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

nodesScope(() => {
	registerBaseNodes(IF_NODE);
});
