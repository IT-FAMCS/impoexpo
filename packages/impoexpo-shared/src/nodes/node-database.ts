import { create } from "@orama/orama";
import type { AllowedSchemaType, BaseNode } from "./node-types";

export const nodesDatabase = create({
	schema: {
		name: "string",
		category: "string",
	},
});

export const baseNodesMap: Map<
	string,
	BaseNode<string, string, AllowedSchemaType, AllowedSchemaType>
> = new Map();
