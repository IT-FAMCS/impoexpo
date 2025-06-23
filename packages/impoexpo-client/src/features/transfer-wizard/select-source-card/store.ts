import type { Integration } from "@/types/Integration";
import {
	WIZARD_STORE_CATEGORY,
	createResettable,
} from "../../../stores/resettable";

export enum SourceCardState {
	MAYBE_IMPORT_PROJECT_TEMPLATE = 0,
	SELECT_SOURCE = 1,
	AUTHENTICATE_SOURCE = 2,
	VERIFY_SOURCE = 3,
	HYDRATE_SOURCE = 4,
	CHECK_ADDED_SOURCES = 5,
	DONE = 6,
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
	state: SourceCardState.MAYBE_IMPORT_PROJECT_TEMPLATE,
	integrationType: "read",
	currentIntegration: undefined,

	setState: (newState: SourceCardState) => set(() => ({ state: newState })),
	setIntegrationType: (newType: "read" | "write") =>
		set(() => ({ integrationType: newType })),
	setCurrentIntegration: (integration: Integration) =>
		set(() => ({ currentIntegration: integration })),
}));
