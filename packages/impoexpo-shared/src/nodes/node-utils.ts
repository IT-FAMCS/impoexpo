import type {
	ObjectEntry,
	BaseNode,
	NodePropertyOptions,
	BaseNodeEntry,
} from "./node-types";
import * as v from "valibot";

export const generic = <T extends string>(name: T) =>
	v.pipe(v.unknown(), v.metadata({ metadataType: "generic", typeName: name }));
export const isGeneric = (
	schema: ObjectEntry,
): schema is ReturnType<typeof generic> => {
	if (isObject(schema))
		return Object.values(schema.entries).some((entry) => isGeneric(entry));
	const metadata = v.getMetadata(schema);
	return "metadataType" in metadata && metadata.metadataType === "generic";
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

export const FLOW_MARKER: string = "__ptr__";
export const flow = () =>
	v.pipe(v.nullable(v.array(v.string())), v.metadata({ metadataType: "flow" }));
export const isFlow = (
	schema: ObjectEntry,
): schema is ReturnType<typeof flow> => {
	const metadata = v.getMetadata(schema);
	return "metadataType" in metadata && metadata.metadataType === "flow";
};

export const subflowArgument = <TSInput>() =>
	v.metadata<TSInput, { metadataType: "subflowArgument" }>({
		metadataType: "subflowArgument",
	});
export const isSubflowArgument = (schema: ObjectEntry): boolean => {
	const metadata = v.getMetadata(schema);
	return (
		"metadataType" in metadata && metadata.metadataType === "subflowArgument"
	);
};

export const named = (
	name: string,
	child: v.ObjectSchema<v.ObjectEntries, undefined>,
) => v.pipe(child, v.metadata({ metadataType: "named", objectName: name }));
export const isNamed = (
	schema: ObjectEntry,
): schema is ReturnType<typeof named> => {
	const metadata = v.getMetadata(schema);
	return "metadataType" in metadata && metadata.metadataType === "named";
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

export const isRecord = (
	schema: ObjectEntry,
): schema is v.RecordSchema<
	v.GenericSchema<string, string | number | symbol>,
	ObjectEntry,
	undefined
> => {
	return schema.type === "record";
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

export const isEntryGeneric = (entry: ObjectEntry): boolean => {
	if (isArray(entry)) return isEntryGeneric(entry.item);
	if (isRecord(entry))
		return isEntryGeneric(entry.key) || isEntryGeneric(entry.value);
	if (isNullable(entry)) return isEntryGeneric(entry.wrapped);
	if (isObject(entry))
		return Object.values(entry.entries).some((v) => isEntryGeneric(v));
	if (isGeneric(entry)) return true;
	return false;
};
