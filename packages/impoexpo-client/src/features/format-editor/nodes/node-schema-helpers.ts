import { baseNodesMap } from "@impoexpo/shared/nodes/node-database";
import {
	getEntrySchema,
	unwrapNodeIfNeeded,
} from "@impoexpo/shared/nodes/node-utils";
import { type MessageDescriptor, i18n } from "@lingui/core";
import type { Connection, Edge, Node } from "@xyflow/react";
import {
	localizableString,
	type NodePropertyOptionsMetadata,
	useRenderableNodesStore,
} from "./renderable-node-types";

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
		return localizableString(renderProperties.inputs[propertyName].title);
	if (renderProperties.outputs?.[propertyName]?.title !== undefined)
		return localizableString(renderProperties.outputs[propertyName].title);
	return propertyName;
};

export const extractPropertyDescription = (
	type: string,
	propertyName: string,
): string | undefined => {
	const renderProperties = useRenderableNodesStore
		.getState()
		.nodeRenderOptions.get(type);
	if (renderProperties === undefined)
		throw new Error(
			`attempted to extract property description of an invalid node with type "${type}"`,
		);

	const schema = unwrapNodeIfNeeded(
		// biome-ignore lint/style/noNonNullAssertion: guaranteed to exist by now
		getEntrySchema(baseNodesMap.get(type)!, propertyName),
	);

	if (renderProperties.inputs?.[propertyName]?.description !== undefined)
		return localizableString(renderProperties.inputs[propertyName].description);
	if (renderProperties.outputs?.[propertyName]?.description !== undefined)
		return localizableString(
			renderProperties.outputs[propertyName].description,
		);
	return schema.expects;
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
		? localizableString(renderProperties.inputs[propertyName]?.placeholder)
		: propertyName;
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
		getEntrySchema(source, connection.sourceHandle),
	);
	const targetSchema = unwrapNodeIfNeeded(
		getEntrySchema(target, connection.targetHandle),
	);
	return sourceSchema.expects === targetSchema.expects;
};
