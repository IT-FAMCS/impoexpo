import { createResettable, WIZARD_STORE_CATEGORY } from "./resettable";

export enum TransferWizardStage {
	SELECT_SOURCE = 0,
	FORMAT = 1,
	TRANSFER = 2,
	DONE = 3,
}

export type TransferWizardStore = {
	stage: TransferWizardStage;
	setStage: (newStage: TransferWizardStage) => void;
};

export const useTransferWizardStore = createResettable<TransferWizardStore>(
	WIZARD_STORE_CATEGORY,
)((set) => ({
	stage: TransferWizardStage.SELECT_SOURCE,
	setStage: (newStage: TransferWizardStage) => set(() => ({ stage: newStage })),
}));
