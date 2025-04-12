import type { AllowedObjectEntry, BaseNode } from "./node-types";

export const baseNodesMap: Map<
	string,
	BaseNode<
		Record<string, AllowedObjectEntry>,
		Record<string, AllowedObjectEntry>
	>
> = new Map();
export const registerBaseNodes = (
	...nodes: BaseNode<
		Record<string, AllowedObjectEntry>,
		Record<string, AllowedObjectEntry>
	>[]
) => {
	for (const node of nodes) {
		const id = `${node.category}-${node.name}`;
		// TODO: remove this console.log
		console.log(`registering ${id}`);
		baseNodesMap.set(id, node);
	}
};
export const nodeInitializers: Array<() => void> = new Array();
export let nodesInitialized = false;
export const initializeNodes = () => {
	if (nodesInitialized) return;
	for (const initializer of nodeInitializers) initializer();
	nodesInitialized = true;
};
export const nodesScope = (initializer: () => void) =>
	nodeInitializers.push(initializer);
