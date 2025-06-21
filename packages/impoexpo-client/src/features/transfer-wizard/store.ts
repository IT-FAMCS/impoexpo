import {
	WIZARD_STORE_CATEGORY,
	createResettable,
} from "../../stores/resettable";

export enum TransferWizardStage {
	SELECT_SOURCE = 0,
	FORMAT = 1,
	TRANSFER = 2,
	DONE = 3,
}

export enum FormatEditorWrapperState {
	HIDDEN = 0,
	IN = 1,
	IDLE = 2,
	OUT = 3,
}

export type TransferWizardStore = {
	stage: TransferWizardStage;
	setStage: (newStage: TransferWizardStage) => void;
};

export type FormatEditorWrapperStore = {
	state: FormatEditorWrapperState;
	setState: (newState: FormatEditorWrapperState) => void;
};

export const useTransferWizardStore = createResettable<TransferWizardStore>(
	WIZARD_STORE_CATEGORY,
)((set) => ({
	stage: TransferWizardStage.SELECT_SOURCE,
	setStage: (newStage: TransferWizardStage) => set({ stage: newStage }),
}));

export const useFormatEditorWrapperStore =
	createResettable<FormatEditorWrapperStore>(WIZARD_STORE_CATEGORY)((set) => ({
		state: FormatEditorWrapperState.HIDDEN,
		setState: (newState: FormatEditorWrapperState) => set({ state: newState }),
	}));
