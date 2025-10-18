import type { ObjectEntry } from "./node-types";
import type * as v from "valibot";
import {
	isArray,
	isMap,
	isNullable,
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
> = (obj: v.InferOutput<TInSchema>) => v.InferOutput<TOutSchema> | null;

export const typeConverters: {
	inSchema: ObjectEntry;
	outSchema: ObjectEntry;
	faulty: boolean;
	converter: TypeConverter<ObjectEntry, ObjectEntry>;
}[] = [];

type ExtendsNull<T> = null extends T ? true : false;
const extendsNull = <T>(): ExtendsNull<T> => true as ExtendsNull<T>;

export const registerConverter = <
	TInSchema extends ObjectEntry,
	TOutSchema extends ObjectEntry,
	TReturn extends v.InferOutput<TOutSchema> | null,
>(
	inSchema: TInSchema,
	outSchema: TOutSchema,
	converter: (obj: v.InferOutput<TInSchema>) => TReturn,
) => {
	if (schemasConvertible(inSchema, outSchema)) {
		console.warn(
			`a converter for types ${schemaToString(inSchema)} and ${schemaToString(outSchema)} has already been registered!`,
		);
		return;
	}
	typeConverters.push({
		inSchema,
		outSchema,
		faulty: extendsNull<TReturn>(),
		converter,
	});
};

const internalSchemasConvertible = (
	sourceSchema: ObjectEntry,
	targetSchema: ObjectEntry,
): boolean => {
	if (isPipe(sourceSchema))
		return schemasConvertible(
			sourceSchema.pipe[0],
			isPipe(targetSchema) ? targetSchema.pipe[0] : targetSchema,
		);

	if (isNullable(sourceSchema))
		return schemasConvertible(
			sourceSchema.wrapped,
			isNullable(targetSchema) ? targetSchema.wrapped : targetSchema,
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

	if (isNullable(sourceSchema))
		return createCompleteConverter(
			sourceSchema.wrapped,
			isNullable(targetSchema) ? targetSchema.wrapped : targetSchema,
		);

	if (isPipe(sourceSchema))
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
