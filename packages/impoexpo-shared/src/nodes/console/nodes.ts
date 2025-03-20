import { nonEmpty, object, optional, pipe, string } from "valibot";
import { nodesScope, registerBaseNodes } from "../node-utils";
import { BaseNode } from "../node-types";

export namespace nodes.base.console {
	export const CONSOLE_WRITE_NODE = new BaseNode({
		name: "write",
		category: "console",
		inputSchema: object({
			text: string(),
			optionalText: optional(string(), "meow!"),
			meow: optional(pipe(string(), nonEmpty())),
		}),
	});

	nodesScope(() => {
		registerBaseNodes(true, CONSOLE_WRITE_NODE);
	});
}
