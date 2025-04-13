import type { ObjectEntry, BaseNode, NodePropertyOptions } from "./node-types";
import type * as v from "valibot";

export const unwrapNodeIfNeeded = (node: ObjectEntry): ObjectEntry => {
	// NOTE: do not unwrap nullable types here! they must be handled by the user
	// with special nodes.
	return node.type === "optional"
		? unwrapNodeIfNeeded(
				(node as v.OptionalSchema<ObjectEntry, unknown>).wrapped,
			)
		: node;
};

export const isArray = (
	schema: ObjectEntry,
): schema is v.ArraySchema<ObjectEntry, undefined> => {
	return schema.type === "array";
};

export const isPicklist = (
	schema: ObjectEntry,
): schema is v.PicklistSchema<
	NodePropertyOptions<typeof schema>,
	undefined
> => {
	return schema.type === "picklist";
};

export const isEnum = (
	schema: ObjectEntry,
): schema is v.EnumSchema<NodePropertyOptions<typeof schema>, undefined> => {
	return schema.type === "enum";
};

export type ValidatorFunction = (
	dataset: v.UnknownDataset,
	config: v.Config<v.BaseIssue<unknown>>,
) => v.OutputDataset<unknown, v.BaseIssue<unknown>>;

export type DefaultBaseNode = BaseNode<v.ObjectEntries, v.ObjectEntries>;

export const findCompatibleEntry = (
	fromNode: DefaultBaseNode,
	fromEntryKey: string,
	toNode: DefaultBaseNode,
): [string, ObjectEntry] => {
	const fromEntry = fromNode.entry(fromEntryKey, true);

	const entries =
		fromEntry.source === "input"
			? (toNode.outputSchema?.entries ?? {})
			: (toNode.inputSchema?.entries ?? {});
	for (const [name, entry] of Object.entries(entries)) {
		const toHandleSchema = unwrapNodeIfNeeded(entry);
		if (fromEntry.schema.type === toHandleSchema.type) return [name, entry];
	}

	throw new Error(
		`couldn't find a compatible entry between ${fromNode.name} <=> ${toNode.name} (entry ${fromEntryKey}, expects ${fromEntry.type})`,
	);
};
