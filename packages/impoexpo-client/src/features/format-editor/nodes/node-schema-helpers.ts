import {
	type BaseNode,
	baseNodesMap,
	type AllowedObjectEntry,
	unwrapNodeIfNeeded,
} from "@impoexpo/shared";
import type { EnumSchema, PicklistSchema } from "valibot";
import {
	type NodePropertyOptionsMetadata,
	useRenderableNodesStore,
	type NodePropertyOptions,
	FLOW_HANDLE_MARKER,
} from "./renderable-node-types";
import type * as v from "valibot";
import type { Connection, Edge, Node } from "@xyflow/react";

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
): NodePropertyOptionsMetadata | undefined => {
	const nodeData = baseNodesMap.get(nodeType);
	const renderOptions = useRenderableNodesStore
		.getState()
		.nodeRenderOptionsMap.get(nodeType);
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
		Partial<{ title: string; description: string }>
	>;

	if (!(key in options)) return { title: key, key: key };

	// biome-ignore lint/style/noNonNullAssertion: checked above
	const data = options[key]!;
	const keyString = key.toString();
	return {
		key: keyString,
		title: data.title ?? keyString,
		description: data.description ?? undefined,
	};
};

export const extractPropertyTitle = (type: string, propertyName: string) => {
	const renderProperties = useRenderableNodesStore
		.getState()
		.nodeRenderOptionsMap.get(type);
	if (renderProperties === undefined)
		throw new Error(
			`attempted to extract property title of an invalid node with type "${type}"`,
		);

	if (
		renderProperties.inputs !== undefined &&
		propertyName in renderProperties.inputs
	) {
		return renderProperties.inputs[propertyName]?.title ?? propertyName;
	}
	if (
		renderProperties.outputs !== undefined &&
		propertyName in renderProperties.outputs
	) {
		return renderProperties.outputs[propertyName]?.title ?? propertyName;
	}
	return propertyName;
};

export const extractPropertyPlaceholder = (
	type: string,
	propertyName: string,
) => {
	const renderProperties = useRenderableNodesStore
		.getState()
		.nodeRenderOptionsMap.get(type);
	if (renderProperties === undefined)
		throw new Error(
			`attempted to extract property input placeholder of an invalid node with type "${type}"`,
		);

	return renderProperties.inputs !== undefined &&
		propertyName in renderProperties.inputs
		? (renderProperties.inputs[propertyName]?.placeholder ?? propertyName)
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
const getHandleSchema = (
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

export const nodeSchemasCompatible = (
	connection: Connection | Edge,
	getNodes: () => Node[],
): boolean => {
	if (!connection.sourceHandle || !connection.targetHandle) return false;

	const sourceIsFlow = connection.sourceHandle.startsWith(FLOW_HANDLE_MARKER);
	const targetIsFlow = connection.targetHandle.startsWith(FLOW_HANDLE_MARKER);

	if (sourceIsFlow || targetIsFlow) {
		if (sourceIsFlow && targetIsFlow && connection.source === connection.target)
			return false;

		if (
			sourceIsFlow &&
			(!targetIsFlow || connection.sourceHandle === connection.targetHandle)
		)
			return false;
		if (
			targetIsFlow &&
			(!sourceIsFlow || connection.sourceHandle === connection.targetHandle)
		)
			return false;

		return true;
	}

	const sourceType = getNodes().find((n) => n.id === connection.source)?.type;
	const targetType = getNodes().find((n) => n.id === connection.target)?.type;
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
