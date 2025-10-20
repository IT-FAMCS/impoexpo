import type { ObjectEntry } from "./node-types";
import type * as v from "valibot";
import {
	isArray,
	isCustomType,
	isGeneric,
	isMap,
	isNullable,
	isOptional,
	isPipe,
	isRecord,
	isUnion,
	isUnionOrEqual,
} from "./node-utils";
import { schemaToString } from "./schema-string-conversions";
import moize from "moize";

export type TypeConverter<
	TInSchema extends ObjectEntry,
	TOutSchema extends ObjectEntry,
> = (obj: v.InferOutput<TInSchema>) => v.InferOutput<TOutSchema>;

export const typeConverters: {
	inSchema: ObjectEntry;
	outSchema: ObjectEntry;
	faulty: boolean;
	converter: TypeConverter<ObjectEntry, ObjectEntry>;
}[] = [];

export const registerConverter = <
	TInSchema extends ObjectEntry,
	TOutSchema extends ObjectEntry,
>(
	inSchema: TInSchema,
	outSchema: TOutSchema,
	converter: TypeConverter<TInSchema, TOutSchema>,
) => {
	if (schemasConvertible(inSchema, outSchema)) {
		console.warn(
			`a converter for types ${schemaToString(inSchema)} and ${schemaToString(outSchema)} has already been registered!`,
		);
		return;
	}
	typeConverters.push({
		inSchema,
		outSchema: isNullable(outSchema) ? outSchema.wrapped : outSchema,
		faulty: isNullable(outSchema),
		converter: converter as unknown as TypeConverter<ObjectEntry, ObjectEntry>,
	});
};

const isWrapped = (
	schema: ObjectEntry,
): schema is
	| v.NullableSchema<ObjectEntry, null>
	| v.OptionalSchema<ObjectEntry, null> =>
	isNullable(schema) || isOptional(schema);

const internalSchemasConvertible = (
	sourceSchema: ObjectEntry,
	targetSchema: ObjectEntry,
): boolean => {
	if (
		(!isGeneric(sourceSchema) && isGeneric(targetSchema)) ||
		(isGeneric(sourceSchema) && !isGeneric(targetSchema))
	)
		return true;

	if (
		isPipe(sourceSchema) &&
		!isCustomType(sourceSchema) &&
		!isCustomType(targetSchema)
	)
		return schemasConvertible(
			sourceSchema.pipe[0],
			isPipe(targetSchema) ? targetSchema.pipe[0] : targetSchema,
		);

	if (isWrapped(sourceSchema) || isWrapped(targetSchema))
		return schemasConvertible(
			isWrapped(sourceSchema) ? sourceSchema.wrapped : sourceSchema,
			isWrapped(targetSchema) ? targetSchema.wrapped : targetSchema,
		);

	if (isUnion(sourceSchema))
		return sourceSchema.options.some((so) =>
			isUnion(targetSchema)
				? targetSchema.options.some((to) => schemasConvertible(so, to))
				: schemasConvertible(so, targetSchema),
		);

	if (!isArray(sourceSchema) && isArray(targetSchema))
		return schemasConvertible(sourceSchema, targetSchema.item);

	if (isArray(sourceSchema) && isArray(targetSchema))
		return schemasConvertible(sourceSchema.item, targetSchema.item);

	if (
		(isRecord(sourceSchema) || isMap(sourceSchema)) &&
		(isRecord(targetSchema) || isMap(targetSchema))
	)
		return (
			schemasConvertible(sourceSchema.key, targetSchema.key) &&
			schemasConvertible(sourceSchema.value, targetSchema.value)
		);

	if (isUnionOrEqual(sourceSchema, targetSchema)) return true;

	return typeConverters.some(
		(tc) =>
			isUnionOrEqual(tc.inSchema, sourceSchema) &&
			isUnionOrEqual(tc.outSchema, targetSchema),
	);
};
export const schemasConvertible = moize(internalSchemasConvertible, {
	isDeepEqual: true,
});

export const getConverterForSchemas = (
	sourceSchema: ObjectEntry,
	targetSchema: ObjectEntry,
): {
	faulty: boolean;
	converter: TypeConverter<ObjectEntry, ObjectEntry>;
} => {
	if (isUnionOrEqual(sourceSchema, targetSchema))
		return {
			faulty: false,
			converter: (obj: v.InferOutput<typeof sourceSchema>) =>
				obj as v.InferOutput<typeof targetSchema>,
		};
	const info = typeConverters.find(
		(tc) =>
			isUnionOrEqual(tc.inSchema, sourceSchema) &&
			isUnionOrEqual(tc.outSchema, targetSchema),
	);
	if (!info)
		throw new Error(
			`types ${schemaToString(sourceSchema)} and ${schemaToString(targetSchema)} are not convertible!`,
		);

	return { converter: info.converter, faulty: info.faulty };
};

const internalCreateCompleteConverter = <
	TInSchema extends ObjectEntry,
	TOutSchema extends ObjectEntry,
>(
	sourceSchema: TInSchema,
	targetSchema: TOutSchema,
): {
	faulty: boolean;
	converter: (
		source: v.InferOutput<TInSchema>,
	) => v.InferOutput<TOutSchema> | null;
} => {
	if (!schemasConvertible(sourceSchema, targetSchema))
		throw new Error(
			`types ${schemaToString(sourceSchema)} and ${schemaToString(targetSchema)} are not convertible!`,
		);

	if (isWrapped(sourceSchema) || isWrapped(targetSchema))
		return createCompleteConverter(
			isWrapped(sourceSchema) ? sourceSchema.wrapped : sourceSchema,
			isWrapped(targetSchema) ? targetSchema.wrapped : targetSchema,
		);

	// TODO
	if (
		(!isGeneric(sourceSchema) && isGeneric(targetSchema)) ||
		(isGeneric(sourceSchema) && !isGeneric(targetSchema))
	)
		return {
			faulty: false,
			converter: (source: v.InferOutput<TInSchema>) => source,
		};

	if (
		isPipe(sourceSchema) &&
		!isCustomType(sourceSchema) &&
		!isCustomType(targetSchema)
	)
		return createCompleteConverter(
			sourceSchema.pipe[0],
			isPipe(targetSchema) ? targetSchema.pipe[0] : targetSchema,
		);

	if (isUnion(sourceSchema)) {
		const exactMatch = sourceSchema.options.some((so) =>
			isUnion(targetSchema)
				? targetSchema.options.some((to) => isUnionOrEqual(so, to))
				: isUnionOrEqual(so, targetSchema),
		);
		if (exactMatch)
			return {
				faulty: false,
				converter: (source: v.InferOutput<TInSchema>) => source,
			};
		return createCompleteConverter(
			// biome-ignore lint/style/noNonNullAssertion: this is checked by schemasConvertible
			sourceSchema.options.find((so) =>
				isUnion(targetSchema)
					? targetSchema.options.some((to) => schemasConvertible(so, to))
					: schemasConvertible(so, targetSchema),
			)!,
			targetSchema,
		);
	}

	if (!isArray(sourceSchema) && isArray(targetSchema))
		return {
			faulty: createCompleteConverter(sourceSchema, targetSchema.item).faulty,
			converter: (source: v.InferOutput<TInSchema>) => [
				createCompleteConverter(sourceSchema, targetSchema.item).converter(
					source,
				),
			],
		};

	if (isArray(sourceSchema) && isArray(targetSchema))
		return {
			faulty: createCompleteConverter(sourceSchema.item, targetSchema.item)
				.faulty,
			converter: (source: v.InferOutput<TInSchema>) =>
				(source as v.InferOutput<TInSchema>[]).map((it) =>
					createCompleteConverter(
						sourceSchema.item,
						targetSchema.item,
					).converter(it),
				),
		};

	if (
		(isRecord(sourceSchema) || isMap(sourceSchema)) &&
		(isRecord(targetSchema) || isMap(targetSchema))
	) {
		return {
			faulty:
				createCompleteConverter(sourceSchema.key, targetSchema.key).faulty ||
				createCompleteConverter(sourceSchema.value, targetSchema.value).faulty,
			converter: (source: v.InferOutput<TInSchema>) =>
				new Map<
					v.InferOutput<typeof targetSchema.key>,
					v.InferOutput<typeof targetSchema.value>
				>(
					Array.from(
						(
							source as Map<
								v.InferOutput<typeof sourceSchema.key>,
								v.InferOutput<typeof sourceSchema.value>
							>
						).entries(),
					).map(([k, v]) => [
						createCompleteConverter(
							sourceSchema.key,
							targetSchema.key,
						).converter(k),
						createCompleteConverter(
							sourceSchema.value,
							targetSchema.value,
						).converter(v),
					]),
				),
		};
	}

	return getConverterForSchemas(sourceSchema, targetSchema);
};
export const createCompleteConverter = moize(internalCreateCompleteConverter, {
	isDeepEqual: true,
});
