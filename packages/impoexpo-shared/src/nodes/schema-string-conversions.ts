import {
	type GenericSchema,
	array,
	boolean,
	nullable,
	number,
	record,
	string,
	union,
} from "valibot";
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
	generic,
	resolveCustomType,
	getCustomTypeResolvedGenerics,
} from "./node-utils";

const defaultSchemaConverters: Record<string, () => ObjectEntry> = {
	string: string,
	number: number,
	boolean: boolean,
};
const customTypeSchemaConverters: Record<string, () => ObjectEntry> = {};
export const registerCustomType = (
	name: string,
	generator: () => ObjectEntry,
) => {
	customTypeSchemaConverters[name] = generator;
};
export const customType = (name: string) => {
	const generator = customTypeSchemaConverters[name];
	if (!generator) throw new Error(`unknown custom type "${name}"`);
	return generator();
};

export const schemaFromString = (raw: string): ObjectEntry => {
	const str = raw.trim();

	// (something) | null
	const nullRegexMatches = /(.*\S)\s*\|\s?null/.exec(str);
	if (nullRegexMatches) return nullable(schemaFromString(nullRegexMatches[1]));

	// array
	const arrayRegexMatches = /Array<(.+)>/.exec(str);
	if (arrayRegexMatches) return array(schemaFromString(arrayRegexMatches[1]));

	// dictionary
	const dictionaryRegexMatches = /Dictionary<(.+),\s?(.+)>/.exec(str);
	if (dictionaryRegexMatches)
		return record(
			schemaFromString(dictionaryRegexMatches[1]) as GenericSchema<
				string,
				string | number | symbol
			>,
			schemaFromString(dictionaryRegexMatches[2]),
		);

	// union
	if (str.split("|").length > 1) {
		return union(str.split(" | ").map((p) => schemaFromString(p)));
	}

	// custom type
	if (str in customTypeSchemaConverters)
		return customTypeSchemaConverters[str]();

	// generic custom type
	const genericRegexMatches = /([\w\-\$@#]+)<(.*)>/.exec(str);
	if (genericRegexMatches) {
		const schema = schemaFromString(genericRegexMatches[1]);
		const resolvers = genericRegexMatches[2];
		const entries = genericEntries(schema);
		if (!entries || entries.length !== resolvers.length)
			throw new Error(
				`custom generic type count mismatch for ${genericRegexMatches[1]}: expected ${entries?.length ?? 0}, got ${resolvers.length}`,
			);
		for (let i = 0; i < entries.length; i++) {
			try {
				const resolver = schemaFromString(resolvers[i]);
				replaceGenericWithSchema(schema, resolver, entries[i]);
				if (isCustomType(schema))
					resolveCustomType(schema, entries[i], resolver);
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

	if (isGeneric(schema)) return getGenericName(schema);
	if (isCustomType(schema)) {
		const generic = genericEntries(schema) ?? [];
		const resolved = getCustomTypeResolvedGenerics(schema);
		return `${getCustomTypeName(schema)}${generic.length !== 0 ? `<${generic.map((s) => (s in resolved ? schemaToString(resolved[s]) : s))}>` : ""}`;
	}
	if (isUnion(schema))
		return schema.options.map((o) => schemaToString(o)).join(" | ");
	if (isPipe(schema)) return schemaToString(schema.pipe[0]);
	return schema.expects;
};
