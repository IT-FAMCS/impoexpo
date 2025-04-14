import type {
	ObjectEntry,
	BaseNode,
	NodePropertyOptions,
	BaseNodeEntry,
} from "./node-types";
import * as v from "valibot";

const hasMetadata = (
	schema: ObjectEntry,
): schema is v.SchemaWithPipe<
	[
		ObjectEntry,
		v.MetadataAction<
			ObjectEntry,
			{
				metadataType: string;
			}
		>,
	]
> => {
	const isPipe = (
		schema: ObjectEntry,
	): schema is v.SchemaWithPipe<[ObjectEntry, v.GenericPipeAction]> =>
		"pipe" in schema;

	const isMetadataAction = (
		item: v.GenericPipeAction,
	): item is v.MetadataAction<ObjectEntry, Record<string, unknown>> => {
		return item.type === "metadata";
	};

	return (
		isPipe(schema) &&
		schema.pipe.length > 1 &&
		isMetadataAction(schema.pipe[1]) &&
		"metadataType" in schema.pipe[1].metadata
	);
};

export const generic = (name: string) =>
	v.pipe(v.unknown(), v.metadata({ metadataType: "generic", typeName: name }));
export const isGeneric = (
	schema: ObjectEntry,
): schema is ReturnType<typeof generic> => {
	if (isObject(schema))
		return Object.values(schema.entries).some((entry) => isGeneric(entry));
	return (
		hasMetadata(schema) && schema.pipe[1].metadata.metadataType === "generic"
	);
};
export const getGenericEntries = (
	schema: ObjectEntry,
): ReturnType<typeof generic>[] => {
	return isObject(schema)
		? Object.values(schema.entries).filter((entry) => isGeneric(entry))
		: isGeneric(schema)
			? [schema]
			: [];
};
export const getGenericName = (schema: ReturnType<typeof generic>): string =>
	schema.pipe[1].metadata.typeName;

export const named = (
	name: string,
	child: v.ObjectSchema<v.ObjectEntries, undefined>,
) => v.pipe(child, v.metadata({ metadataType: "named", objectName: name }));
export const isNamed = (
	schema: ObjectEntry,
): schema is ReturnType<typeof named> => {
	return (
		hasMetadata(schema) && schema.pipe[1].metadata.metadataType === "named"
	);
};
export const getObjectName = (schema: ReturnType<typeof named>) =>
	schema.pipe[1].metadata.objectName;

export const unwrapNodeIfNeeded = (node: ObjectEntry): ObjectEntry => {
	// NOTE: do not unwrap nullable types here! they must be handled by the user
	// with special nodes.
	return isOptional(node) ? unwrapNodeIfNeeded(node.wrapped) : node;
};

export const getRootSchema = (node: ObjectEntry): ObjectEntry => {
	if (isOptional(node)) return getRootSchema(node.wrapped);
	if (isArray(node)) return getRootSchema(node.item);
	if (isNullable(node)) return getRootSchema(node.wrapped);
	return node;
};

export const isOptional = (
	schema: ObjectEntry,
): schema is v.OptionalSchema<ObjectEntry, unknown> => {
	return schema.type === "optional";
};

export const isObject = (
	schema: ObjectEntry,
): schema is v.ObjectSchema<v.ObjectEntries, undefined> => {
	return schema.type === "object";
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
	const fromEntry = fromNode.entry(fromEntryKey);

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
