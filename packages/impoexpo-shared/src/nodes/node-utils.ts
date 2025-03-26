import type { OptionalSchema } from "valibot";
import { baseNodesMap } from "./node-database";
import type { AllowedObjectEntry, BaseNode } from "./node-types";

export const unwrapNodeIfNeeded = (
	node: AllowedObjectEntry,
): AllowedObjectEntry => {
	return node.type === "optional"
		? unwrapNodeIfNeeded(
				(node as OptionalSchema<AllowedObjectEntry, unknown>).wrapped,
			)
		: node;
};

export const registerBaseNodes = (
	...nodes: BaseNode<
		string,
		string,
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

const nodeInitializers: Array<() => void> = new Array();
let nodesInitialized = false;

export const initializeNodes = () => {
	if (nodesInitialized) return;
	for (const initializer of nodeInitializers) initializer();
	nodesInitialized = true;
};

export const nodesScope = (initializer: () => void) =>
	nodeInitializers.push(initializer);
