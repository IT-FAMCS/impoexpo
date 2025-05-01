import {
	baseNodesMap,
	getBaseNode,
} from "@impoexpo/shared/nodes/node-database";
import type { Connection, Edge } from "@xyflow/react";
import type { FlowParent, ProjectNode } from "./renderable-node-types";
import {
	FLOW_MARKER,
	isArray,
	isFlow,
	isNullable,
} from "@impoexpo/shared/nodes/node-utils";
import type { ObjectEntry } from "@impoexpo/shared/nodes/node-types";

export const findFlowParent = (
	nodes: ProjectNode[],
	edges: Edge[],
	node: ProjectNode,
): FlowParent | null => {
	const check = (id: string): FlowParent | null => {
		if (node.data.flow) return node.data.flow;

		const base = baseNodesMap.get(nodes.find((n) => n.id === id)?.type ?? "");
		if (!base) throw new Error(`couldn't get node base for "${id}"`);

		for (const key of Object.keys(base.inputSchema?.entries ?? {})) {
			const edge = edges.find((e) => e.target === id && e.targetHandle === key);
			if (edge) return check(edge.source);
		}

		return null;
	};

	return check(node.id);
};

export const nodeSchemasCompatible = (
	connection: Connection | Edge,
	nodes: ProjectNode[],
	edges: Edge[],
): boolean => {
	if (!connection.sourceHandle || !connection.targetHandle) return false;

	const sourceNode = nodes.find((n) => n.id === connection.source);
	const targetNode = nodes.find((n) => n.id === connection.target);
	if (!sourceNode?.type || !targetNode?.type) return false;

	const source = getBaseNode(sourceNode.type);
	const target = getBaseNode(targetNode.type);

	if (
		isFlow(source.entry(connection.sourceHandle).schema) &&
		connection.targetHandle === FLOW_MARKER
	) {
		// if we're attaching a flow node (source) to a regular node (target),
		// the target node should not have anything connected to it, as it can break flows
		return !edges.some((e) => e.source === connection.target);
	}

	const sourceEntry = source.entry(connection.sourceHandle);
	const targetEntry = target.entry(connection.targetHandle);
	if (!sourceEntry || !targetEntry) return false;

	const newEntryFlowParent = findFlowParent(nodes, edges, sourceNode);
	if (newEntryFlowParent) {
		for (const key of Object.keys(target.inputSchema?.entries ?? {})) {
			const edge = edges.find(
				(e) => e.target === targetNode.id && e.targetHandle === key,
			);
			const node = nodes.find((n) => n.id === edge?.source);
			if (edge && node) {
				const entryFlowParent = findFlowParent(nodes, edges, node);
				if (
					entryFlowParent &&
					(newEntryFlowParent.node !== entryFlowParent.node ||
						newEntryFlowParent.entry !== entryFlowParent.entry)
				)
					return false;
			}
		}
		return true;
	}

	if (sourceEntry.generic && targetEntry.generic) return false;
	if (
		(sourceEntry.generic && !targetEntry.generic) ||
		(!sourceEntry.generic && targetEntry.generic)
	) {
		const genericEntry = sourceEntry.generic ? sourceEntry : targetEntry;
		const nonGenericEntry = sourceEntry.generic ? targetEntry : sourceEntry;

		const compatibleWithGenericEntry = (
			generic: ObjectEntry,
			nonGeneric: ObjectEntry,
		): boolean => {
			if (isNullable(generic) && !isNullable(nonGeneric)) return false;
			if (isNullable(generic) && isNullable(nonGeneric))
				return compatibleWithGenericEntry(generic.wrapped, nonGeneric.wrapped);

			if (isArray(generic) && !isArray(nonGeneric)) return false;
			if (isArray(generic) && isArray(nonGeneric))
				return compatibleWithGenericEntry(generic.item, nonGeneric.item);

			return true;
		};

		return compatibleWithGenericEntry(
			genericEntry.schema,
			nonGenericEntry.schema,
		);
	}
	return sourceEntry.type === targetEntry.type;
};
