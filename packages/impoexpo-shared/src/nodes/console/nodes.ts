import { type } from "arktype";
import { registerBaseNodes } from "../node-utils";
import { BaseNode } from "../node-types";

export namespace nodes.base.console {
	export const CONSOLE_WRITE_NODE = new BaseNode({
		name: "write",
		category: "console",
		inputSchema: type({
			text: "string",
		}),
	});

	registerBaseNodes(true, CONSOLE_WRITE_NODE);
}
