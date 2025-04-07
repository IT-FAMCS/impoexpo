import type { AllowedObjectEntry } from "@impoexpo/shared/nodes/node-types";
import { array, boolean, nullable, number, string } from "valibot";

const schemaConverterMap: Record<string, () => AllowedObjectEntry> = {
	string: string,
	number: number,
	boolean: boolean,
};

export const schemaFromString = (raw: string): AllowedObjectEntry => {
	const str = raw.trim();
	if (str.includes("| null"))
		return nullable(schemaFromString(str.split("| null")[0]));
	if (str.includes("[]")) return array(schemaFromString(str.split("[]")[0]));
	if (str in schemaConverterMap) return schemaConverterMap[str]();

	throw new Error(`failed to convert ${str} into a schema object`);
};
