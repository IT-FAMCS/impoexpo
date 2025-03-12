import type { Integration } from "@/types/Integration";
import { create } from "zustand";

export enum SourceCardState {
	SELECT_READ_SOURCE = 0,
	AUTHENTICATE_READ_SOURCE = 1,
	VERIFY_READ_SOURCE = 2,
	HYDRATE_READ_SOURCE = 3,

	SELECT_WRITE_SOURCE = 4,
	AUTHENTICATE_WRITE_SOURCE = 5,
	VERIFY_WRITE_SOURCE = 6,
	HYDRATE_WRITE_SOURCE = 7,

	DONE = 9,
}

export type SourceCardStore = {
	state: SourceCardState;
	readIntegration?: Integration;
	writeIntegration?: Integration;
};

export type SourceCardStoreActions = {
	setState: (newState: SourceCardState) => void;
	setReadIntegration: (integration: Integration) => void;
	setWriteIntegration: (integration: Integration) => void;
	reset: () => void;
};

const initialState: SourceCardStore = {
	state: SourceCardState.SELECT_READ_SOURCE,
	readIntegration: undefined,
	writeIntegration: undefined,
};

export const useSourceCardStore = create<
	SourceCardStore & SourceCardStoreActions
>((set) => ({
	state: SourceCardState.SELECT_READ_SOURCE,
	reset: () => set(initialState),

	setReadIntegration: (integration: Integration) =>
		set((state) => ({
			...state,
			readIntegration: integration,
			state: SourceCardState.AUTHENTICATE_READ_SOURCE,
		})),
	setWriteIntegration: (integration: Integration) =>
		set((state) => ({
			...state,
			readIntegration: integration,
			state: SourceCardState.AUTHENTICATE_WRITE_SOURCE,
		})),

	setState: (newState: SourceCardState) => set(() => ({ state: newState })),
}));
