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

export const findCompatibleEntry = (
	fromNode: DefaultBaseNode,
	fromEntryKey: string,
	toNode: DefaultBaseNode,
): [string, AllowedObjectEntry] => {
	const fromEntry = fromNode.entry(fromEntryKey, true);

	const entries =
		fromEntry.source === "input"
			? (toNode.outputSchema?.entries ?? {})
			: (toNode.inputSchema?.entries ?? {});
	for (const [name, entry] of Object.entries(entries)) {
		const toHandleSchema = unwrapNodeIfNeeded(entry);
		if (fromEntry.schema.expects === toHandleSchema.expects)
			return [name, entry];
	}

	throw new Error(
		`couldn't find a compatible entry between ${fromNode.name} <=> ${toNode.name} (entry ${fromEntryKey}, expects ${fromEntry.schema.expects})`,
	);
};
