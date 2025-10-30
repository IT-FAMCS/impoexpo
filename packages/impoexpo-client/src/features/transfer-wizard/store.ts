import {
	WIZARD_STORE_CATEGORY,
	createResettable,
} from "../../stores/resettable";

export enum TransferWizardStage {
	SELECT_SOURCE = 0,
	FORMAT = 1,
	TRANSFER = 2,
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
	collapseSidebar: boolean;
	setCollapseSidebar: (newCollapseSidebar: boolean) => void;
};

export type FormatEditorWrapperStore = {
	state: FormatEditorWrapperState;
	setState: (newState: FormatEditorWrapperState) => void;
};

export const useTransferWizardStore = createResettable<TransferWizardStore>(
	WIZARD_STORE_CATEGORY,
)((set) => ({
	stage: TransferWizardStage.SELECT_SOURCE,
	setStage: (newStage) => set({ stage: newStage }),
	collapseSidebar: false,
	setCollapseSidebar: (newCollapseSidebar) =>
		set({ collapseSidebar: newCollapseSidebar }),
}));

export const useFormatEditorWrapperStore =
	createResettable<FormatEditorWrapperStore>(WIZARD_STORE_CATEGORY)((set) => ({
		state: FormatEditorWrapperState.HIDDEN,
		setState: (newState: FormatEditorWrapperState) => set({ state: newState }),
	}));
