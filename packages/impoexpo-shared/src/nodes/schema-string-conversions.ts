import * as v from "valibot";
import type { ObjectEntry } from "./node-types";
import {
	isArray,
	isNullable,
	isCustomType,
	isGeneric,
	getGenericName,
	getCustomTypeName,
	isRecord,
	isPipe,
	isUnion,
	replaceGenericWithSchema,
	genericEntries,
	resolveCustomType,
	customType,
	getCustomTypeGenerics,
	dateTime,
	isDateTime,
} from "./node-utils";

const defaultSchemaConverters: Record<string, () => ObjectEntry> = {
	string: v.string,
	number: v.number,
	boolean: v.boolean,
	DateTime: () => dateTime(),
};
const customTypeSchemaConverters: Record<string, () => v.ObjectEntries> = {};
export const registerCustomType = <T extends v.ObjectEntries>(
	name: string,
	generator: () => T,
) => {
	customTypeSchemaConverters[name] = generator;
	return customType(name, generator());
};

export const schemaFromString = (raw: string): ObjectEntry => {
	const str = raw.trim();

	// (something) | null
	const nullRegexMatches = /(.*\S)\s*\|\s?null/.exec(str);
	if (nullRegexMatches)
		return v.nullable(schemaFromString(nullRegexMatches[1]));

	// array
	const arrayRegexMatches = /Array<(.+)>/.exec(str);
	if (arrayRegexMatches) return v.array(schemaFromString(arrayRegexMatches[1]));

	// dictionary
	const dictionaryRegexMatches = /Dictionary<(.+),\s?(.+)>/.exec(str);
	if (dictionaryRegexMatches)
		return v.record(
			schemaFromString(dictionaryRegexMatches[1]) as v.GenericSchema<
				string,
				string | number | symbol
			>,
			schemaFromString(dictionaryRegexMatches[2]),
		);

	// union
	if (str.split("|").length > 1) {
		return v.union(str.split("|").map((p) => schemaFromString(p)));
	}

	// custom type
	if (str in customTypeSchemaConverters)
		return customType(str, customTypeSchemaConverters[str]());

	// generic custom type
	const genericRegexMatches = /([\w\-\$@#]+)<(.*)>/.exec(str);
	if (genericRegexMatches) {
		let schema = schemaFromString(genericRegexMatches[1]);
		const resolvers = genericRegexMatches[2].split(",");
		const entries = genericEntries(schema);
		if (!entries || entries.length !== resolvers.length)
			throw new Error(
				`custom generic type count mismatch for ${genericRegexMatches[1]}: expected ${entries?.length ?? 0}, got ${resolvers.length}`,
			);
		for (let i = 0; i < entries.length; i++) {
			try {
				const resolver = schemaFromString(resolvers[i]);
				schema = replaceGenericWithSchema(schema, resolver, entries[i]);
			} catch {}
		}
		return schema;
	}

	// default
	if (str in defaultSchemaConverters) return defaultSchemaConverters[str]();
	throw new Error(`failed to convert ${str} into a schema object`);
};

export const schemaToString = (schema: ObjectEntry): string => {
	if (isArray(schema)) return `Array<${schemaToString(schema.item)}>`;
	if (isRecord(schema))
		return `Dictionary<${schemaToString(schema.key)}, ${schemaToString(schema.value)}>`;
	if (isNullable(schema))
		return `${schemaToString(schema.wrapped)}${isNullable(schema.wrapped) ? "" : " | null"}`;

	if (isDateTime(schema)) return "DateTime";
	if (isCustomType(schema)) {
		const generics = Object.entries(getCustomTypeGenerics(schema));
		return `${getCustomTypeName(schema)}${generics.length !== 0 ? `<${generics.map(([key, schema]) => (schema ? schemaToString(schema) : key)).join(", ")}>` : ""}`;
	}
	if (isGeneric(schema)) return getGenericName(schema);
	if (isUnion(schema))
		return schema.options.map((o) => schemaToString(o)).join(" | ");
	if (isPipe(schema)) return schemaToString(schema.pipe[0]);
	return schema.expects;
};
