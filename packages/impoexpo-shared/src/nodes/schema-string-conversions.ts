import {
	type GenericSchema,
	array,
	boolean,
	nullable,
	number,
	record,
	string,
} from "valibot";
import type { ObjectEntry } from "./node-types";
import {
	isArray,
	isNullable,
	isNamed,
	isGeneric,
	getGenericName,
	getObjectName,
	isRecord,
} from "./node-utils";

const schemaConverterMap: Record<string, () => ObjectEntry> = {
	string: string,
	number: number,
	boolean: boolean,
};

export const schemaFromString = (raw: string): ObjectEntry => {
	const str = raw.trim();

	const nullRegexMatches = /(.*\S)\s*\|\s?null/.exec(str);
	if (nullRegexMatches) return nullable(schemaFromString(nullRegexMatches[1]));

	const arrayRegexMatches = /Array<(.+)>/.exec(str);
	if (arrayRegexMatches) return array(schemaFromString(arrayRegexMatches[1]));

	const dictionaryRegexMatches = /Dictionary<(.+),\s?(.+)>/.exec(str);
	if (dictionaryRegexMatches)
		return record(
			schemaFromString(dictionaryRegexMatches[1]) as GenericSchema<
				string,
				string | number | symbol
			>,
			schemaFromString(dictionaryRegexMatches[2]),
		);

	if (str in schemaConverterMap) return schemaConverterMap[str]();
	throw new Error(`failed to convert ${str} into a schema object`);
};

export const schemaToString = (schema: ObjectEntry): string => {
	if (isArray(schema)) return `Array<${schemaToString(schema.item)}>`;
	if (isRecord(schema))
		return `Dictionary<${schemaToString(schema.key)}, ${schemaToString(schema.value)}>`;
	if (isNullable(schema))
		return `${schemaToString(schema.wrapped)}${isNullable(schema.wrapped) ? "" : " | null"}`;
	if (isNamed(schema)) return getObjectName(schema);
	if (isGeneric(schema)) return getGenericName(schema);
	return schema.expects;
};
