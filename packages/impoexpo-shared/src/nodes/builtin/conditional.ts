import { boolean, object, unknown } from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-database";

export const IF_NODE = new BaseNode({
	category: "conditional",
	name: "if",
	inputSchema: object({
		condition: boolean(),
		trueValue: unknown(),
		falseValue: unknown(),
	}),
	outputSchema: object({
		out: unknown(),
	}),
	genericProperties: {
		T: ["out", "falseValue", "trueValue"],
	},
});

nodesScope(() => {
	registerBaseNodes(IF_NODE);
});
