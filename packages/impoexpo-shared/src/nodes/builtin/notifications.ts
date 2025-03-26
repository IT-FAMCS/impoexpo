import { object, string } from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-utils";

export const INFORMATION_NOTIFICATION_NODE = new BaseNode({
	name: "information",
	category: "notifications",
	inputSchema: object({
		message: string(),
	}),
});

export const WARNING_NOTIFICATION_NODE = new BaseNode({
	name: "warning",
	category: "notifications",
	inputSchema: object({
		message: string(),
	}),
});

export const ERROR_NOTIFICATION_NODE = new BaseNode({
	name: "error",
	category: "notifications",
	inputSchema: object({
		message: string(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		true,
		INFORMATION_NOTIFICATION_NODE,
		WARNING_NOTIFICATION_NODE,
		ERROR_NOTIFICATION_NODE,
	);
});
