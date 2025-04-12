import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import type { Connection, Edge, Node } from "@xyflow/react";

export const nodeSchemasCompatible = (
	connection: Connection | Edge,
	nodes: Node[],
): boolean => {
	if (!connection.sourceHandle || !connection.targetHandle) return false;

	const sourceType = nodes.find((n) => n.id === connection.source)?.type;
	const targetType = nodes.find((n) => n.id === connection.target)?.type;
	if (!sourceType || !targetType) return false;

	const source = baseNodesMap.get(sourceType);
	const target = baseNodesMap.get(targetType);
	if (!source || !target) return false;

	const sourceSchema = source.entry(connection.sourceHandle, true).schema;
	const targetSchema = target.entry(connection.targetHandle, true).schema;
	return sourceSchema.expects === targetSchema.expects;
};
