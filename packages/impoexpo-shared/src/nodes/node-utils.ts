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
export const getGenericName = (schema: ReturnType<typeof generic>): string =>
	schema.pipe[1].metadata.typeName;

export const FLOW_MARKER: string = "__ptr__";
export const flow = (returnType?: ObjectEntry) =>
	v.pipe(
		v.nullable(v.array(v.string())),
		v.metadata({ metadataType: "flow", returnType }),
	);
export const isFlow = (
	schema: ObjectEntry,
): schema is ReturnType<typeof flow> => {
	const metadata = v.getMetadata(schema);
	return "metadataType" in metadata && metadata.metadataType === "flow";
};
export const getFlowReturnTypes = (
	schema: ReturnType<typeof flow>,
): ObjectEntry[] | undefined => {
	const type = schema.pipe[1].metadata.returnType;
	if (!type) return undefined;
	return isUnion(type) ? type.options : [type];
};

export const subflowArgument = <TSInput, TParent extends string>(
	parent: TParent,
) =>
	v.metadata<TSInput, { metadataType: "subflowArgument"; parent: TParent }>({
		metadataType: "subflowArgument",
		parent,
	});
export const isSubflowArgument = (
	schema: ObjectEntry,
): schema is v.SchemaWithPipe<
	[ObjectEntry, ReturnType<typeof subflowArgument>]
> => {
	const metadata = v.getMetadata(schema);
	return (
		"metadataType" in metadata && metadata.metadataType === "subflowArgument"
	);
};
export const getSubflowArgumentParent = (schema: ObjectEntry) => {
	if (!isSubflowArgument(schema))
		throw new Error(
			`attempted to get a subflow's argument parent on a non-subflow-argument schema: ${JSON.stringify(schema)}`,
		);
	return schema.pipe[1].metadata.parent;
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
	if (isOptional(node)) return unwrapNodeIfNeeded(node.wrapped);
	return node;
};

export const getRootSchema = (node: ObjectEntry): ObjectEntry => {
	if (isOptional(node)) return getRootSchema(node.wrapped);
	if (isArray(node)) return getRootSchema(node.item);
	if (isNullable(node)) return getRootSchema(node.wrapped);
	return node;
};

export const isUnion = (
	schema: ObjectEntry,
): schema is v.UnionSchema<ObjectEntry[], undefined> => {
	return schema.type === "union";
};

export const isPipe = (
	schema: ObjectEntry,
): schema is v.SchemaWithPipe<[ObjectEntry, v.GenericPipeAction]> =>
	"pipe" in schema;

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

export const genericEntries = (entry: ObjectEntry): string[] | undefined => {
	// NOTE: do not change the order of checks here!
	if (isFlow(entry) && getFlowReturnTypes(entry))
		return (getFlowReturnTypes(entry) ?? [])
			.flatMap((t) => genericEntries(t))
			.filter((t) => t !== undefined);
	if (isArray(entry)) return genericEntries(entry.item);
	if (isRecord(entry))
		return [
			...(genericEntries(entry.key) ?? []),
			...(genericEntries(entry.value) ?? []),
		].filter((e) => e !== undefined);
	if (isNullable(entry)) return genericEntries(entry.wrapped);
	if (isObject(entry))
		return Object.values(entry.entries)
			.flatMap((v) => genericEntries(v))
			.filter((v) => v !== undefined);
	if (isGeneric(entry)) return [getGenericName(entry)];
	if (isPipe(entry)) return genericEntries(entry.pipe[0]);
	return undefined;
};
