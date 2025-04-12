import type {
	AllowedObjectEntry,
	BaseNode,
	NodePropertyOptions,
} from "./node-types";
import type * as v from "valibot";

export const unwrapNodeIfNeeded = (
	node: AllowedObjectEntry,
): AllowedObjectEntry => {
	return node.type === "optional"
		? unwrapNodeIfNeeded(
				(node as v.OptionalSchema<AllowedObjectEntry, unknown>).wrapped,
			)
		: node;
};

export const isPicklist = (
	schema: AllowedObjectEntry,
): schema is v.PicklistSchema<
	NodePropertyOptions<typeof schema>,
	undefined
> => {
	return schema.type === "picklist";
};

export const isEnum = (
	schema: AllowedObjectEntry,
): schema is v.EnumSchema<NodePropertyOptions<typeof schema>, undefined> => {
	return schema.type === "enum";
};

export type ValidatorFunction = (
	dataset: v.UnknownDataset,
	config: v.Config<v.BaseIssue<unknown>>,
) => v.OutputDataset<unknown, v.BaseIssue<unknown>>;

type DefaultBaseNode = BaseNode<
	Record<string, AllowedObjectEntry>,
	Record<string, AllowedObjectEntry>
>;

export const getEntrySchema = (
	node: DefaultBaseNode,
	handle: string,
): AllowedObjectEntry => {
	if (node.inputSchema && handle in node.inputSchema.entries)
		return node.inputSchema.entries[handle];
	if (node.outputSchema && handle in node.outputSchema.entries)
		return node.outputSchema.entries[handle];
	throw new Error(
		`couldn't get entry "${handle}" in node with type "${node.category}-${node.name}"`,
	);
};

export const getEntrySource = (
	node: DefaultBaseNode,
	handle: string,
): "input" | "output" => {
	if (node.inputSchema && handle in node.inputSchema.entries) return "input";
	if (node.outputSchema && handle in node.outputSchema.entries) return "output";
	throw new Error(
		`couldn't get entry "${handle}" in node with type "${node.category}-${node.name}"`,
	);
};

export const findCompatibleEntry = (
	fromNode: DefaultBaseNode,
	fromEntry: string,
	toNode: DefaultBaseNode,
): [string, AllowedObjectEntry] => {
	const fromEntrySource = getEntrySource(fromNode, fromEntry);
	const fromEntrySchema = unwrapNodeIfNeeded(
		getEntrySchema(fromNode, fromEntry),
	);

	const entries =
		fromEntrySource === "input"
			? (toNode.outputSchema?.entries ?? {})
			: (toNode.inputSchema?.entries ?? {});
	for (const [name, entry] of Object.entries(entries)) {
		const toHandleSchema = unwrapNodeIfNeeded(entry);
		if (fromEntrySchema.expects === toHandleSchema.expects)
			return [name, entry];
	}
	throw new Error(
		`couldn't find a compatible entry between ${fromNode.name} <=> ${toNode.name} (entry ${fromEntry}, expects ${fromEntrySchema.expects})`,
	);
};
