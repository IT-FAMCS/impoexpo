import {
	defaultSettings,
	settingsSchema,
	type Settings,
} from "@/types/settings";
import { create } from "zustand";
import * as dottie from "dottie";
import { is } from "valibot";
import { deepCopy } from "deep-copy-ts";

export type SettingsStoreMethods = {
	put: (path: string, value: unknown) => void;
	load: () => void;
};

export const useSettingsStore = create<Settings & SettingsStoreMethods>(
	(set, get) => ({
		...defaultSettings,
		put: (path, value) => {
			const copy = deepCopy<Settings>(get());
			dottie.set(copy, path, value);
			set(copy);
			localStorage.setItem("settings", JSON.stringify(copy));
		},
		load: () => {
			try {
				const parsed = JSON.parse(localStorage.getItem("settings") ?? "");
				if (!is(settingsSchema, parsed))
					throw new Error("object does not match SettingsSchema");
				set(parsed);
			} catch (err) {
				console.warn(
					`failed to load settings from local storage, using default settings (${err})`,
				);
				set(defaultSettings);
			}
		},
	}),
);
