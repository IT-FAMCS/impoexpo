import type { Integration } from "@/types/Integration";
import { create } from "zustand";

export enum SourceCardState {
	SELECT_SOURCE = 0,
	AUTHENTICATE_SOURCE = 1,
	VERIFY_SOURCE = 2,
	HYDRATE_SOURCE = 3,
	DONE = 4,
}

export type SourceCardStore = {
	state: SourceCardState;
	integrationType: "read" | "write";
	currentIntegration?: Integration;
};

export type SourceCardStoreActions = {
	setState: (newState: SourceCardState) => void;
	setIntegrationType: (newType: "read" | "write") => void;
	setCurrentIntegration: (integration: Integration) => void;
	reset: () => void;
};

const initialState: SourceCardStore = {
	state: SourceCardState.SELECT_SOURCE,
	integrationType: "read",
	currentIntegration: undefined,
};

export const useSourceCardStore = create<
	SourceCardStore & SourceCardStoreActions
>((set) => ({
	...initialState,

	reset: () => set(initialState),
	setState: (newState: SourceCardState) => set(() => ({ state: newState })),
	setIntegrationType: (newType: "read" | "write") =>
		set(() => ({ integrationType: newType })),
	setCurrentIntegration: (integration: Integration) =>
		set(() => ({ currentIntegration: integration })),
}));
