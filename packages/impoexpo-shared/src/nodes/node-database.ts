import type { AllowedObjectEntry, BaseNode } from "./node-types";

export const baseNodesMap: Map<
	string,
	BaseNode<
		Record<string, AllowedObjectEntry>,
		Record<string, AllowedObjectEntry>
	>
> = new Map();
