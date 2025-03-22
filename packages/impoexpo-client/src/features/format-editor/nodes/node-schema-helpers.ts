import { baseNodesMap, type AllowedObjectEntry } from "@impoexpo/shared";
import type { EnumSchema, PicklistSchema } from "valibot";
import {
	type NodePropertyOptionsMetadata,
	useRenderableNodesStore,
	type NodePropertyOptions,
} from "./renderable-node-types";
import * as v from "valibot";

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
		renderOptions.properties === undefined ||
		!(propertyName in renderOptions.properties)
	)
		return undefined;
	// biome-ignore lint/style/noNonNullAssertion: guaranteed to exist
	const property = renderOptions.properties[propertyName]!;
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
	return renderProperties.properties !== undefined &&
		propertyName in renderProperties.properties
		? (renderProperties.properties[propertyName]?.title ?? propertyName)
		: propertyName;
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
	return renderProperties.properties !== undefined &&
		propertyName in renderProperties.properties
		? (renderProperties.properties[propertyName]?.placeholder ?? propertyName)
		: propertyName;
};

export type ValidatorFunction = (
	dataset: v.UnknownDataset,
	config: v.Config<v.BaseIssue<unknown>>,
) => v.OutputDataset<unknown, v.BaseIssue<unknown>>;
