import type { OptionalSchema } from "valibot";
import { nodesDatabase, baseNodesMap } from "./node-database";
import type { AllowedObjectEntry, BaseNode } from "./node-types";
import { insert } from "@orama/orama";

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

		const tags: Set<string> = new Set();
		for (const entry of Object.values(node.inputSchema?.entries ?? [])) {
			tags.add(`accepts:${unwrapNodeIfNeeded(entry).expects}`);
		}
		for (const entry of Object.values(node.outputSchema?.entries ?? [])) {
			tags.add(`outputs:${unwrapNodeIfNeeded(entry).expects}`);
		}
		console.log(tags);

		if (searchable) {
			insert(nodesDatabase, {
				category: node.category,
				name: node.name,
				tags: Array.from(tags),
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
