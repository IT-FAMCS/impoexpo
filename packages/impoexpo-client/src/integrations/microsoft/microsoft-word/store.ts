import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";

export enum MicrosoftWordHydratorState {
	UPLOAD = 0,
	EXTRACT = 1,
	VERIFY = 2,
}

export type MicrosoftWordDocumentPreview = {
	filename: string;
	data: ArrayBuffer;
};

export type MicrosoftWordHydratorStore = {
	state: MicrosoftWordHydratorState;
	setState: (newState: MicrosoftWordHydratorState) => void;

	documents: Array<MicrosoftWordDocumentPreview>;
	currentDocument?: MicrosoftWordDocumentPreview;
	addDocument: (filename: string, data: ArrayBuffer) => void;
	setCurrentDocument: (document?: MicrosoftWordDocumentPreview) => void;
};

export const useMicrosoftWordHydratorStore =
	createResettable<MicrosoftWordHydratorStore>(WIZARD_STORE_CATEGORY)(
		(set, get) => ({
			state: MicrosoftWordHydratorState.UPLOAD,
			setState: (ns) => set({ state: ns }),

			documents: [],
			addDocument: (filename, data) =>
				set((state) => ({
					documents: state.documents.concat({ filename, data }),
				})),
			setCurrentDocument: (document) => set({ currentDocument: document }),
		}),
	);
