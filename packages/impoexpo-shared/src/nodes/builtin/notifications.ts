import * as v from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope } from "../node-database";
import { registerBaseNodes } from "../node-database";

export const INFORMATION_NOTIFICATION_NODE = new BaseNode({
	name: "information",
	category: "notifications",
	inputSchema: v.object({
		message: v.string(),
		condition: v.optional(v.boolean(), true),
	}),
});

export const WARNING_NOTIFICATION_NODE = new BaseNode({
	name: "warning",
	category: "notifications",
	inputSchema: v.object({
		message: v.string(),
		condition: v.optional(v.boolean(), true),
	}),
});

export const ERROR_NOTIFICATION_NODE = new BaseNode({
	name: "error",
	category: "notifications",
	inputSchema: v.object({
		message: v.string(),
		condition: v.optional(v.boolean(), true),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		INFORMATION_NOTIFICATION_NODE,
		WARNING_NOTIFICATION_NODE,
		ERROR_NOTIFICATION_NODE,
	);
});
