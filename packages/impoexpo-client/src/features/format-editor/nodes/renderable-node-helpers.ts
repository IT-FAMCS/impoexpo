import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type { Connection, Edge } from "@xyflow/react";
import type { ProjectNode } from "./renderable-node-types";
import {
	getRootSchema,
	isArray,
	isGeneric,
	isNullable,
	isUnion,
} from "@impoexpo/shared/nodes/node-utils";
import type { ObjectEntry } from "@impoexpo/shared/nodes/node-types";
import { schemaToString } from "@impoexpo/shared/nodes/schema-string-conversions";

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

	const sourceEntry = source.entry(connection.sourceHandle);
	const targetEntry = target.entry(connection.targetHandle);
	if (!sourceEntry || !targetEntry) return false;

	const isUnionOrEqual = (
		source: ObjectEntry,
		target: ObjectEntry,
	): boolean => {
		if (isUnion(target))
			return target.options.some((opt) => isUnionOrEqual(source, opt));
		return schemaToString(source) === schemaToString(target);
	};

	// allows connecting multiple output of the same type to an array input
	if (
		isArray(targetEntry.schema) &&
		(isUnionOrEqual(sourceEntry.schema, targetEntry.schema.item) ||
			isGeneric(getRootSchema(targetEntry.schema.item)))
	) {
		return true;
	}

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
	return isUnionOrEqual(sourceEntry.schema, targetEntry.schema);
};
