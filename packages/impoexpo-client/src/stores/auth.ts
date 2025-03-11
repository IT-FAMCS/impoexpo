import {
	GoogleExchangeResponse,
	GoogleExchangeResponseSchema,
} from "@impoexpo/shared";
import { create } from "zustand";
import { BaseSchema, BaseIssue, InferOutput, parse } from "valibot";

const STORAGE_PREFIX: string = "impoexpo/auth/";

export type AuthStore = {
	google?: GoogleExchangeResponse;
	setGoogleAuth: (auth: GoogleExchangeResponse) => void;

	load: () => void;
	save: () => void;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
	google: undefined,
	setGoogleAuth: (auth) => set(() => ({ google: auth })),

	load: () => {
		// god forgive me
		set({ google: loadEntry("google", GoogleExchangeResponseSchema) });
	},
	save: () => {
		saveEntry("google", get().google);
	},
}));

const saveEntry = <T>(name: string, value: T) =>
	localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(value));
const loadEntry = <TSchema extends Schema>(
	name: string,
	schema: TSchema,
): InferOutput<TSchema> | undefined => {
	const raw = localStorage.getItem(STORAGE_PREFIX + name);
	if (raw === null) return undefined;

	let json: Record<string, unknown>;
	try {
		json = JSON.parse(raw);
	} catch (err) {
		throw new Error(`object with key "${name}" contained invalid JSON: ${err}`);
	}

	try {
		return parse(schema, json);
	} catch (err) {
		throw new Error(
			`object with key ${name} contained JSON which didn't satisfy the schema: ${err}`,
		);
	}
};

type Schema = BaseSchema<unknown, unknown, BaseIssue<unknown>>;
