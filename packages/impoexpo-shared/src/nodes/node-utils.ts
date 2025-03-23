import type { GenericSchema } from "valibot";
import { nodesDatabase, baseNodesMap } from "./node-database";
import type { AllowedObjectEntry, BaseNode } from "./node-types";
import { insert } from "@orama/orama";

export const registerBaseNodes = (
	searchable = true,
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

		if (searchable) {
			insert(nodesDatabase, {
				category: node.category,
				name: node.name,
			});
		}
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
