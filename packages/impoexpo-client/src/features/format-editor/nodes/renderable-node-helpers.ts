import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type { Connection, Edge, Node } from "@xyflow/react";

export const nodeSchemasCompatible = (
	connection: Connection | Edge,
	nodes: Node[],
): boolean => {
	if (!connection.sourceHandle || !connection.targetHandle) return false;

	const sourceType = nodes.find((n) => n.id === connection.source)?.type;
	const targetType = nodes.find((n) => n.id === connection.target)?.type;
	if (!sourceType || !targetType) return false;

	const source = getBaseNode(sourceType);
	const target = getBaseNode(targetType);

	const sourceEntry = source.entry(connection.sourceHandle);
	const targetEntry = target.entry(connection.targetHandle);
	if (!sourceEntry || !targetEntry) return false;
	if (sourceEntry.generic && targetEntry.generic) return false;
	if (
		(sourceEntry.generic && !targetEntry.generic) ||
		(!sourceEntry.generic && targetEntry.generic)
	)
		return true;
	return sourceEntry.type === targetEntry.type;
};
