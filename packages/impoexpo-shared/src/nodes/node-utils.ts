import type {
	ObjectEntry,
	BaseNode,
	NodePropertyOptions,
	BaseNodeEntry,
} from "./node-types";
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

export const isNullable = (
	schema: ObjectEntry,
): schema is v.NullableSchema<ObjectEntry, null> => {
	return schema.type === "nullable";
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
): BaseNodeEntry => {
	const fromEntry = fromNode.entry(fromEntryKey, true);

	const entries =
		fromEntry.source === "input"
			? Object.keys(toNode.outputSchema?.entries ?? {})
			: Object.keys(toNode.inputSchema?.entries ?? {});
	for (const key of entries) {
		const toEntry = toNode.entry(key);
		if (
			fromEntry.schema.type === toEntry.type ||
			(toEntry.generic && !fromEntry.generic) ||
			(!toEntry.generic && fromEntry.generic)
		)
			return toEntry;
	}

	throw new Error(
		`couldn't find a compatible entry between ${fromNode.category}-${fromNode.name} <=> ${toNode.category}-${toNode.name} (entry ${fromEntryKey}, expects ${fromEntry.type})`,
	);
};
