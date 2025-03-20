import { object, string } from "valibot";
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

	nodesScope(() => {
		registerBaseNodes(true, CONSOLE_WRITE_NODE);
	});
}
