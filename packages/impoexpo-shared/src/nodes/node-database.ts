import { create } from "@orama/orama";
import type { BaseNode } from "./node-types";
import type { GenericSchema } from "valibot";

export const nodesDatabase = create({
	schema: {
		name: "string",
		category: "string",
	},
});

export const baseNodesMap: Map<string, BaseNode<string, string>> = new Map();
