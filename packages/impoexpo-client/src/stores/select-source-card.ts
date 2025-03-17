import type { Integration } from "@/types/Integration";
import { createResettable, WIZARD_STORE_CATEGORY } from "./resettable";

export enum SourceCardState {
	SELECT_SOURCE = 0,
	AUTHENTICATE_SOURCE = 1,
	VERIFY_SOURCE = 2,
	HYDRATE_SOURCE = 3,
	CHECK_ADDED_SOURCES = 4,
	DONE = 5,
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
};

export const useSourceCardStore = createResettable<
	SourceCardStore & SourceCardStoreActions
>(WIZARD_STORE_CATEGORY)((set) => ({
	state: SourceCardState.SELECT_SOURCE,
	integrationType: "read",
	currentIntegration: undefined,

	setState: (newState: SourceCardState) => set(() => ({ state: newState })),
	setIntegrationType: (newType: "read" | "write") =>
		set(() => ({ integrationType: newType })),
	setCurrentIntegration: (integration: Integration) =>
		set(() => ({ currentIntegration: integration })),
}));
