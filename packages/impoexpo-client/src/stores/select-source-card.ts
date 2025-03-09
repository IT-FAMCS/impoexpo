import type { Integration } from "@/types/Integration";
import { create } from "zustand";

export enum SourceCardState {
	SELECT_READ_SOURCE = 0,
	AUTHENTICATE_READ_SOURCE = 1,
	SELECT_WRITE_SOURCE = 2,
	AUTHENTICATE_WRITE_SOURCE = 3,
}

export type SourceCardStore = {
	state: SourceCardState;
	readIntegration?: Integration;
	writeIntegration?: Integration;

	setReadIntegration: (integration: Integration) => void;
	setWriteIntegration: (integration: Integration) => void;
	reset: () => void;
};

export const useSourceCardStore = create<SourceCardStore>((set) => ({
	state: SourceCardState.SELECT_READ_SOURCE,
	reset: () =>
		set(() => ({
			readIntegration: undefined,
			writeIntegration: undefined,
			state: SourceCardState.SELECT_READ_SOURCE,
		})),

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
}));
