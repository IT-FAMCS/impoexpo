import { create } from "zustand";

export enum TransferWizardStage {
	SELECT_SOURCE = 0,
	FORMAT = 1,
	TRANSFER = 2,
	DONE = 3,
}

export type TransferWizardStore = {
	stage: TransferWizardStage;
};

export type TransferWizardStoreActions = {
	setStage: (newStage: TransferWizardStage) => void;
	reset: () => void;
};

const initialState: TransferWizardStore = {
	stage: TransferWizardStage.SELECT_SOURCE,
};

export const useTransferWizardStore = create<
	TransferWizardStore & TransferWizardStoreActions
>((set) => ({
	stage: TransferWizardStage.SELECT_SOURCE,

	setStage: (newStage: TransferWizardStage) => set(() => ({ stage: newStage })),
	reset: () => set(initialState),
}));
