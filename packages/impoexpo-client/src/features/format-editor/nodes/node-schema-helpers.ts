import {
	type BaseNode,
	baseNodesMap,
	type AllowedObjectEntry,
} from "@impoexpo/shared";
import type { EnumSchema, PicklistSchema } from "valibot";
import {
	type NodePropertyOptionsMetadata,
	useRenderableNodesStore,
	type NodePropertyOptions,
} from "./renderable-node-types";
import type * as v from "valibot";

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

export const unwrapIfNeeded = (
	node: AllowedObjectEntry,
): AllowedObjectEntry => {
	return node.type === "optional"
		? unwrapIfNeeded(
				(node as v.OptionalSchema<AllowedObjectEntry, unknown>).wrapped,
			)
		: node;
};

export const areNodesConnectable = (
	source: DefaultBaseNode,
	target: DefaultBaseNode,
	sourceHandle: string,
	targetHandle: string,
): boolean => {
	const sourceSchema = unwrapIfNeeded(getHandleSchema(source, sourceHandle));
	const targetSchema = unwrapIfNeeded(getHandleSchema(target, targetHandle));
	return sourceSchema.expects === targetSchema.expects;
};
