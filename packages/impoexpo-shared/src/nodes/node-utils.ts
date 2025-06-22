import type {
	ObjectEntry,
	BaseNode,
	NodePropertyOptions,
	BaseNodeEntry,
} from "./node-types";
import * as v from "valibot";
import { schemaToString } from "./schema-string-conversions";
import { DateTime } from "luxon";
import moize from "moize";

const dateTimeValidator = (input: unknown) => {
	if (typeof input === "string") return DateTime.fromISO(input).isValid;
	return DateTime.isDateTime(input);
};
export const dateTime = () => v.custom<DateTime>(dateTimeValidator);
export const isDateTime = (
	schema: ObjectEntry,
): schema is ReturnType<typeof dateTime> => {
	return "check" in schema && schema.check === dateTimeValidator;
};

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

export const customType = <T extends v.ObjectEntries = v.ObjectEntries>(
	name: string,
	child: T,
) =>
	v.pipe(
		v.object(child),
		v.metadata({
			metadataType: "custom",
			name,
			generics: Object.values(child)
				.flatMap((c) => genericEntries(c) ?? [])
				.reduce<Record<string, ObjectEntry | null>>((acc, cur) => {
					acc[cur] = null;
					return acc;
				}, {}),
		}),
	);
export const isCustomType = (
	schema: ObjectEntry,
): schema is ReturnType<typeof customType> => {
	const metadata = v.getMetadata(schema);
	return "metadataType" in metadata && metadata.metadataType === "custom";
};
export const resolveCustomType = (
	schema: ReturnType<typeof customType>,
	name: string,
	resolvedWith: ObjectEntry,
) => {
	schema.pipe[1].metadata.generics[name] = resolvedWith;
};
export const getCustomTypeGenerics = (schema: ReturnType<typeof customType>) =>
	schema.pipe[1].metadata.generics;
export const getCustomTypeName = (schema: ReturnType<typeof customType>) =>
	schema.pipe[1].metadata.name;
export const createCustomTypeReplica = (
	schema: ReturnType<typeof customType>,
	newEntries: v.ObjectEntries,
) => {
	return v.pipe(
		v.object(newEntries),
		v.metadata({
			metadataType: "custom",
			name: structuredClone(schema.pipe[1].metadata.name),
			generics: structuredClone(schema.pipe[1].metadata.generics),
		}),
	);
};

export const unwrapNodeIfNeeded = (
	node: ObjectEntry,
	options: { optional: boolean; nullable: boolean } = {
		optional: true,
		nullable: false,
	},
): ObjectEntry => {
	if (isOptional(node) && options.optional)
		return unwrapNodeIfNeeded(node.wrapped);
	if (isNullable(node) && options.nullable)
		return unwrapNodeIfNeeded(node.wrapped);
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
): schema is ReturnType<typeof v.union> => {
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

export const isMap = (
	schema: ObjectEntry,
): schema is v.MapSchema<ObjectEntry, ObjectEntry, undefined> => {
	return schema.type === "map";
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
		if (entriesCompatible(fromEntry, toEntry)) return toEntry;
	}

	throw new Error(
		`couldn't find a compatible entry between ${fromNode.category}-${fromNode.name} <=> ${toNode.category}-${toNode.name} (entry ${fromEntryKey}, expects ${fromEntry.type})`,
	);
};

const internalEntriesCompatible = (
	sourceEntry: BaseNodeEntry,
	targetEntry: BaseNodeEntry,
) => {
	const isUnionOrEqual = (
		source: ObjectEntry,
		target: ObjectEntry,
	): boolean => {
		if (isArray(source) && isArray(target))
			return isUnionOrEqual(source.item, target.item);
		if (
			(isRecord(source) || isMap(source)) &&
			(isRecord(target) || isMap(target))
		)
			return (
				isUnionOrEqual(source.key, target.key) &&
				isUnionOrEqual(source.value, target.value)
			);
		if (isUnion(target))
			return target.options.some((opt) => isUnionOrEqual(source, opt));
		return schemaToString(source) === schemaToString(target);
	};

	// allows connecting multiple output of the same type to an array input
	if (
		isArray(targetEntry.schema) &&
		(isUnionOrEqual(sourceEntry.schema, targetEntry.schema.item) ||
			isGeneric(getRootSchema(targetEntry.schema.item)))
	) {
		return true;
	}

	if (
		(sourceEntry.generics && !targetEntry.generics) ||
		(!sourceEntry.generics && targetEntry.generics)
	) {
		const genericEntry = sourceEntry.generics ? sourceEntry : targetEntry;
		const nonGenericEntry = sourceEntry.generics ? targetEntry : sourceEntry;

		const compatibleWithGenericEntry = (
			generic: ObjectEntry,
			nonGeneric: ObjectEntry,
		): boolean => {
			if (isNullable(generic) && !isNullable(nonGeneric)) return false;
			if (isNullable(generic) && isNullable(nonGeneric))
				return compatibleWithGenericEntry(generic.wrapped, nonGeneric.wrapped);

			if (isArray(generic) && !isArray(nonGeneric)) return false;
			if (isArray(generic) && isArray(nonGeneric))
				return compatibleWithGenericEntry(generic.item, nonGeneric.item);

			return true;
		};

		return compatibleWithGenericEntry(
			genericEntry.schema,
			nonGenericEntry.schema,
		);
	}

	return isUnionOrEqual(sourceEntry.schema, targetEntry.schema);
};
export const entriesCompatible = moize(internalEntriesCompatible, {
	isDeepEqual: true,
});

export const genericEntries = (entry: ObjectEntry): string[] | undefined => {
	// NOTE: do not change the order of checks here!
	if (isArray(entry)) return genericEntries(entry.item);
	if (isRecord(entry) || isMap(entry))
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
	if (isUnion(entry))
		return entry.options.flatMap((o) => genericEntries(o) ?? []);
	return undefined;
};

export const replaceGenericWithSchema = (
	root: ObjectEntry,
	resolver: ObjectEntry,
	name: string,
): ObjectEntry => {
	if (isGeneric(root) && getGenericName(root) === name) return resolver;

	if (isCustomType(root)) {
		let matched = false;
		const replica = createCustomTypeReplica(
			root,
			Object.entries(root.entries).reduce<v.ObjectEntries>((acc, cur) => {
				acc[cur[0]] = replaceGenericWithSchema(cur[1], resolver, name);
				if (acc[cur[0]] !== cur[1]) matched = true;
				return acc;
			}, {}),
		);
		if (matched) resolveCustomType(replica, name, resolver);
		return replica;
	}

	if (isArray(root))
		return v.array(replaceGenericWithSchema(root.item, resolver, name));
	if (isRecord(root) || isMap(root))
		return v.map(
			replaceGenericWithSchema(root.key, resolver, name),
			replaceGenericWithSchema(root.value, resolver, name),
		);
	if (isObject(root)) {
		return v.object(
			Object.entries(root.entries).reduce<v.ObjectEntries>((acc, cur) => {
				acc[cur[0]] = replaceGenericWithSchema(cur[1], resolver, name);
				return acc;
			}, {}),
		);
	}
	if (isNullable(root))
		return v.nullable(replaceGenericWithSchema(root.wrapped, resolver, name));
	if (isPipe(root))
		return v.pipe(
			replaceGenericWithSchema(root.pipe[0], resolver, name),
			...root.pipe.slice(1),
		);

	return root;
};

export const filterObject = <V>(
	obj: Record<string, V>,
	fn: (x: V) => boolean,
) => Object.fromEntries(Object.entries(obj).filter(([, val]) => fn(val)));
