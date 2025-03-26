import {
	type GoogleExchangeResponse,
	GoogleExchangeResponseSchema,
} from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";
import { create } from "zustand";
import * as v from "valibot";

const STORAGE_PREFIX: string = "impoexpo/auth/";
export const storageKeyForIntegration = (name: string) => STORAGE_PREFIX + name;

export type AuthStore = {
	google?: GoogleExchangeResponse;
	ready: boolean;
};

export type AuthStoreActions = {
	setGoogleAuth: (auth: GoogleExchangeResponse) => void;
	resetGoogleAuth: () => void;

	load: () => void;
	save: () => void;
	reset: () => void;
};

const initialState: AuthStore = {
	google: undefined,
	ready: false,
};

export const useAuthStore = create<AuthStore & AuthStoreActions>(
	(set, get) => ({
		...initialState,

		setGoogleAuth: (auth) => set(() => ({ google: auth })),
		resetGoogleAuth: () =>
			set(() => {
				clearEntries("google");
				return { google: undefined };
			}),

		load: () => {
			if (get().ready) return;
			set({
				google: loadEntry("google", GoogleExchangeResponseSchema),
				ready: true,
			});
		},
		save: () => {
			saveEntry("google", get().google);
		},

		reset: () => {
			clearEntries("google");
			set(initialState);
		},
	}),
);

// automagically save to storage when any auth method updates
useAuthStore.subscribe((curr, prev) => {
	if (curr !== prev && curr.ready && prev.ready) {
		curr.save();
	}
});

const clearEntries = (...names: string[]) => {
	for (const name of names)
		localStorage.removeItem(storageKeyForIntegration(name));
};

const saveEntry = <T>(name: string, value?: T) => {
	if (value === undefined) return;
	localStorage.setItem(storageKeyForIntegration(name), JSON.stringify(value));
};

const loadEntry = <const TSchema extends v.GenericSchema>(
	name: string,
	schema: TSchema,
): v.InferOutput<TSchema> | undefined => {
	const raw = localStorage.getItem(storageKeyForIntegration(name));
	if (raw === null) return undefined;

	let json: Record<string, unknown>;
	try {
		json = JSON.parse(raw);
	} catch (err) {
		throw new Error(`object with key "${name}" contained invalid JSON: ${err}`);
	}

	try {
		return v.parse(schema, json);
	} catch (err) {
		throw new Error(
			`object with key ${name} contained JSON which didn't satisfy the schema: ${err}`,
		);
	}
};
