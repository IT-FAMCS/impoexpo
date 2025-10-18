import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type { Connection, Edge } from "@xyflow/react";
import type { ProjectNode } from "./renderable-node-types";
import { entriesCompatible } from "@impoexpo/shared/nodes/node-utils";

export const nodeSchemasCompatible = (
	connection: Connection | Edge,
	nodes: ProjectNode[],
): boolean => {
	if (!connection.sourceHandle || !connection.targetHandle) return false;

	const sourceNode = nodes.find((n) => n.id === connection.source);
	const targetNode = nodes.find((n) => n.id === connection.target);
	if (!sourceNode?.type || !targetNode?.type) return false;

	const source = getBaseNode(sourceNode.type);
	const target = getBaseNode(targetNode.type);

	const sourceEntry = source.entry(connection.sourceHandle);
	const targetEntry = target.entry(connection.targetHandle);
	if (!sourceEntry || !targetEntry) return false;

	return entriesCompatible(sourceEntry, targetEntry, true);
};
