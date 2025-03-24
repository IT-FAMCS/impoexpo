import { create } from "@orama/orama";
import type { AllowedObjectEntry, BaseNode } from "./node-types";

export const nodesDatabase = create({
	schema: {
		name: "string",
		category: "string",
		tags: "string[]",
	},
	components: {
		tokenizer: {
			stemming: true,
			stemmerSkipProperties: ["tags"],
		},
	},
});

export const baseNodesMap: Map<
	string,
	BaseNode<
		string,
		string,
		Record<string, AllowedObjectEntry>,
		Record<string, AllowedObjectEntry>
	>
> = new Map();
