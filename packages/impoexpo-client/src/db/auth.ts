import { globalDatabase } from "./global-database";
import * as v from "valibot";

export interface GlobalAuthTableEntry {
	integration: string;
	data: Record<string, unknown>;
}

export const saveAuthToDatabase = async (
	integration: string,
	data: Record<string, unknown>,
) => {
	await globalDatabase.auth.put({
		integration,
		data,
	});
};

export const getAuthFromDatabase = async <T extends v.GenericSchema>(
	integration: string,
	schema: T,
): Promise<v.InferOutput<T> | undefined> => {
	const entry = await globalDatabase.auth.get(integration);
	if (!entry || !v.is(schema, entry.data)) return undefined;
	return entry.data;
};

export const removeAuthFromDatabase = async (integration: string) => {
	await globalDatabase.auth.delete(integration);
};
