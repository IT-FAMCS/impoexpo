import type { AllowedObjectEntry, BaseNode } from "./node-types";

export const baseNodesMap: Map<
	string,
	BaseNode<
		string,
		string,
		Record<string, AllowedObjectEntry>,
		Record<string, AllowedObjectEntry>
	>
> = new Map();
