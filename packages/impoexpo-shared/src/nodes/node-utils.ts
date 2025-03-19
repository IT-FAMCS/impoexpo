import { type, type Type } from "arktype";
import { nodesDatabase, baseNodesMap } from "./node-database";
import type { AllowedSchemaType, BaseNode } from "./node-types";
import { insert } from "@orama/orama";

export type RegisterNodeOptions = {
	category: string;
	task: string;
	inputs?: Type<unknown>;
	outputs?: Type<unknown>;
	searchable: boolean;
};

export const registerBaseNodes = (
	searchable = true,
	...nodes: BaseNode<string, string, AllowedSchemaType, AllowedSchemaType>[]
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
