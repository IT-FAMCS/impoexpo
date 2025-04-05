import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import type {
	AllowedObjectEntry,
	BaseNode,
} from "@impoexpo/shared/nodes/node-types";
import { unwrapNodeIfNeeded } from "@impoexpo/shared/nodes/node-utils";
import { type MessageDescriptor, i18n } from "@lingui/core";
import type { Connection, Edge, Node } from "@xyflow/react";
import type { EnumSchema, PicklistSchema } from "valibot";
import type * as v from "valibot";
import {
	type NodePropertyOptions,
	type NodePropertyOptionsMetadata,
	useRenderableNodesStore,
} from "./renderable-node-types";

export const isPicklist = (
	schema: AllowedObjectEntry,
): schema is PicklistSchema<NodePropertyOptions<typeof schema>, undefined> => {
	return schema.type === "picklist";
};

export const isEnum = (
	schema: AllowedObjectEntry,
): schema is EnumSchema<NodePropertyOptions<typeof schema>, undefined> => {
	return schema.type === "enum";
};

export const extractOptionMetadata = (
	nodeType: string,
	propertyName: string,
	key: string,
): NodePropertyOptionsMetadata<string> | undefined => {
	const nodeData = baseNodesMap.get(nodeType);
	const renderOptions = useRenderableNodesStore
		.getState()
		.nodeRenderOptions.get(nodeType);
	if (nodeData === undefined || renderOptions === undefined) {
		throw new Error(
			`attempted to extract options of a property from an invalid (unregistered?) node with type "${nodeType}"`,
		);
	}

	if (
		nodeData.inputSchema === undefined ||
		renderOptions.inputs === undefined ||
		!(propertyName in renderOptions.inputs)
	)
		return undefined;
	// biome-ignore lint/style/noNonNullAssertion: guaranteed to exist
	const property = renderOptions.inputs[propertyName]!;
	if (!("options" in property)) return undefined;
	const options = property.options as Record<
		string,
		Partial<{ title: MessageDescriptor; description: MessageDescriptor }>
	>;

	if (!(key in options)) return { title: key, key: key };

	// biome-ignore lint/style/noNonNullAssertion: checked above
	const data = options[key]!;
	const keyString = key.toString();
	return {
		key: keyString,
		title: data.title !== undefined ? i18n.t(data.title) : keyString,
		description:
			data.description !== undefined ? i18n.t(data.description) : undefined,
	};
};

export const extractPropertyTitle = (type: string, propertyName: string) => {
	const renderProperties = useRenderableNodesStore
		.getState()
		.nodeRenderOptions.get(type);
	if (renderProperties === undefined)
		throw new Error(
			`attempted to extract property title of an invalid node with type "${type}"`,
		);

	if (renderProperties.inputs?.[propertyName]?.title !== undefined)
		return i18n.t(renderProperties.inputs[propertyName].title);
	if (renderProperties.outputs?.[propertyName]?.title !== undefined)
		return i18n.t(renderProperties.outputs[propertyName].title);
	return propertyName;
};

export const extractPropertyPlaceholder = (
	type: string,
	propertyName: string,
) => {
	const renderProperties = useRenderableNodesStore
		.getState()
		.nodeRenderOptions.get(type);
	if (renderProperties === undefined)
		throw new Error(
			`attempted to extract property input placeholder of an invalid node with type "${type}"`,
		);

	return renderProperties.inputs?.[propertyName]?.placeholder !== undefined
		? i18n.t(renderProperties.inputs[propertyName]?.placeholder)
		: propertyName;
};

export type ValidatorFunction = (
	dataset: v.UnknownDataset,
	config: v.Config<v.BaseIssue<unknown>>,
) => v.OutputDataset<unknown, v.BaseIssue<unknown>>;

type DefaultBaseNode = BaseNode<
	string,
	string,
	Record<string, AllowedObjectEntry>,
	Record<string, AllowedObjectEntry>
>;

export const getHandleSchema = (
	node: DefaultBaseNode,
	handle: string,
): AllowedObjectEntry => {
	if (node.inputSchema && handle in node.inputSchema.entries)
		return node.inputSchema.entries[handle];
	if (node.outputSchema && handle in node.outputSchema.entries)
		return node.outputSchema.entries[handle];
	throw new Error(
		`couldn't get handle "${handle}" in node with type "${node.category}-${node.name}"`,
	);
};

export const getHandleType = (
	node: DefaultBaseNode,
	handle: string,
): "input" | "output" => {
	if (node.inputSchema && handle in node.inputSchema.entries) return "input";
	if (node.outputSchema && handle in node.outputSchema.entries) return "output";
	throw new Error(
		`couldn't get handle "${handle}" in node with type "${node.category}-${node.name}"`,
	);
};

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

	const sourceSchema = unwrapNodeIfNeeded(
		getHandleSchema(source, connection.sourceHandle),
	);
	const targetSchema = unwrapNodeIfNeeded(
		getHandleSchema(target, connection.targetHandle),
	);
	return sourceSchema.expects === targetSchema.expects;
};
