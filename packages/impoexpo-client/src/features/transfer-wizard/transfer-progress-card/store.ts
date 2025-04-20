import { create } from "zustand";

export enum TransferProgressCardState {
	UPLOADING_PROJECT = 0,
	TRANSFERRING = 1,
}

export type TransferProgressCardStore = {
	state: TransferProgressCardState;
	setState: (ns: TransferProgressCardState) => void;
};

export const useTransferProgressCardStore = create<TransferProgressCardStore>(
	(set) => ({
		state: TransferProgressCardState.UPLOADING_PROJECT,
		setState: (ns) => set({ state: ns }),
	}),
);
