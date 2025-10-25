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
	customType,
	getCustomTypeGenerics,
	dateTime,
	isDateTime,
	isMap,
	isOptional,
} from "./node-utils";
import moize from "moize";
import { DateTime } from "luxon";

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

export const getDefaultValue = (schema: ObjectEntry): unknown => {
	if (isNullable(schema)) return getDefaultValue(schema.wrapped);
	if (isOptional(schema)) return v.getDefault(schema);
	if (isArray(schema)) return [];
	if (isRecord(schema) || isMap(schema)) return {};

	const type = schemaToString(schema);
	switch (type) {
		case "string":
			return "";
		case "number":
			return 0;
		case "DateTime":
			return DateTime.now();
		case "boolean":
			return false;
	}
	return undefined;
};

export const internalSchemaFromString = (raw: string): ObjectEntry => {
	const str = raw.trim();

	// (something) | null
	const nullRegexMatches = /(.*\S)\s*\|\s?null/.exec(str);
	if (nullRegexMatches)
		return v.nullable(internalSchemaFromString(nullRegexMatches[1]));

	// array
	const arrayRegexMatches = /Array<(.+)>/.exec(str);
	if (arrayRegexMatches)
		return v.array(internalSchemaFromString(arrayRegexMatches[1]));

	// dictionary
	const dictionaryRegexMatches = /Dictionary<(.+),\s?(.+)>/.exec(str);
	if (dictionaryRegexMatches)
		// TODO: this might not be desirable (currently, there's no difference between record and map)
		return v.map(
			internalSchemaFromString(dictionaryRegexMatches[1]),
			internalSchemaFromString(dictionaryRegexMatches[2]),
		);

	// union
	if (str.split("|").length > 1) {
		return v.union(str.split("|").map((p) => internalSchemaFromString(p)));
	}

	// custom type
	if (str in customTypeSchemaConverters)
		return customType(str, customTypeSchemaConverters[str]());

	// generic custom type
	const genericRegexMatches = /([\w\-\$@#]+)<(.*)>/.exec(str);
	if (genericRegexMatches) {
		let schema = internalSchemaFromString(genericRegexMatches[1]);
		const resolvers = genericRegexMatches[2].split(",");
		const entries = genericEntries(schema);
		if (!entries || entries.length !== resolvers.length)
			throw new Error(
				`custom generic type count mismatch for ${genericRegexMatches[1]}: expected ${entries?.length ?? 0}, got ${resolvers.length}`,
			);
		for (let i = 0; i < entries.length; i++) {
			try {
				const resolver = internalSchemaFromString(resolvers[i]);
				schema = replaceGenericWithSchema(schema, resolver, entries[i]);
			} catch {}
		}
		return schema;
	}

	// default
	if (str in defaultSchemaConverters) return defaultSchemaConverters[str]();
	throw new Error(`failed to convert ${str} into a schema object`);
};

export const internalSchemaToString = (schema: ObjectEntry): string => {
	if (isArray(schema)) return `Array<${internalSchemaToString(schema.item)}>`;
	if (isRecord(schema) || isMap(schema))
		return `Dictionary<${internalSchemaToString(schema.key)}, ${internalSchemaToString(schema.value)}>`;
	if (isNullable(schema))
		return `${internalSchemaToString(schema.wrapped)}${isNullable(schema.wrapped) ? "" : " | null"}`;

	if (isDateTime(schema)) return "DateTime";
	if (isCustomType(schema)) {
		const generics = Object.entries(getCustomTypeGenerics(schema));
		return `${getCustomTypeName(schema)}${generics.length !== 0 ? `<${generics.map(([key, schema]) => (schema ? internalSchemaToString(schema) : key)).join(", ")}>` : ""}`;
	}
	if (isGeneric(schema)) return getGenericName(schema);
	if (isUnion(schema))
		return schema.options.map((o) => internalSchemaToString(o)).join(" | ");
	if (isPipe(schema)) return internalSchemaToString(schema.pipe[0]);
	return schema.expects;
};

export const schemaFromString = moize(internalSchemaFromString, {
	isDeepEqual: true,
});
export const schemaToString = moize(internalSchemaToString, {
	isDeepEqual: true,
});
