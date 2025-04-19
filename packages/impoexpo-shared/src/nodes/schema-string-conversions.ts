import { array, boolean, nullable, number, string } from "valibot";
import type { ObjectEntry } from "./node-types";
import {
	isArray,
	isNullable,
	isNamed,
	isGeneric,
	generic,
	getGenericName,
	getObjectName,
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
	if (str in schemaConverterMap) return schemaConverterMap[str]();

	throw new Error(`failed to convert ${str} into a schema object`);
};

export const schemaToString = (
	schema: ObjectEntry,
): { type: string; generic?: string } => {
	if (isArray(schema)) {
		const item = schemaToString(schema.item);
		return { type: `Array<${item.type}>`, generic: item.generic };
	}

	if (isNullable(schema)) {
		const wrapped = schemaToString(schema.wrapped);
		return {
			type: `${wrapped.type}${isNullable(schema.wrapped) ? "" : " | null"}`,
			generic: wrapped.generic,
		};
	}

	if (isNamed(schema)) return { type: getObjectName(schema) };
	if (isGeneric(schema))
		return { type: getGenericName(schema), generic: getGenericName(schema) };
	return { type: schema.expects };
};
