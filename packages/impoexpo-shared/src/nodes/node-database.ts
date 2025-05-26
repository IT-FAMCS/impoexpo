import type { BaseNode } from "./node-types";
import type { ObjectEntries } from "valibot";
import type { DefaultBaseNode } from "./node-utils";

export const baseNodesMap: Map<
	string,
	BaseNode<ObjectEntries, ObjectEntries>
> = new Map();

export const registerBaseNodes = (
	...nodes: BaseNode<ObjectEntries, ObjectEntries>[]
) => {
	for (const node of nodes) {
		const id = `${node.category}-${node.name}`;
		baseNodesMap.set(id, node);
	}
};

export const unregisterBaseNodes = (
	...nodes: BaseNode<ObjectEntries, ObjectEntries>[]
) => {
	for (const node of nodes) {
		const id = `${node.category}-${node.name}`;
		baseNodesMap.delete(id);
	}
};

export const nodeInitializers: (() => void)[] = [];
export let nodesInitialized = false;

export const initializeNodes = () => {
	if (nodesInitialized) return;
	for (const initializer of nodeInitializers) initializer();
	nodesInitialized = true;
};
export const nodesScope = (initializer: () => void) =>
	nodeInitializers.push(initializer);

export const getBaseNode = (type: string): DefaultBaseNode => {
	if (!baseNodesMap.has(type))
		throw new Error(`no base node was found with the type "${type}"`);
	// biome-ignore lint/style/noNonNullAssertion: checked above
	return baseNodesMap.get(type)!;
};
