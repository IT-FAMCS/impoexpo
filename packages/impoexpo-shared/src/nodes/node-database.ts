import type { BaseNode } from "./node-types";
import type { ObjectEntries } from "valibot";
import type { DefaultBaseNode } from "./node-utils";

export const baseNodes: Record<
	string,
	BaseNode<ObjectEntries, ObjectEntries>
> = {};

export const registerBaseNodes = (
	...nodes: BaseNode<ObjectEntries, ObjectEntries>[]
) => {
	for (const node of nodes) {
		const id = `${node.category}-${node.name}`;
		baseNodes[id] = node;
	}
};

export const unregisterBaseNodes = (
	...nodes: BaseNode<ObjectEntries, ObjectEntries>[]
) => {
	for (const node of nodes) {
		const id = `${node.category}-${node.name}`;
		delete baseNodes[id];
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
	if (!(type in baseNodes))
		throw new Error(`no base node was found with the type "${type}"`);
	return baseNodes[type];
};
