import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";

export enum MicrosoftWordHydratorState {
	UPLOAD = 0,
	LAYOUT = 1,
	VERIFY = 2,
}

export type MicrosoftWordHydratorStore = {
	state: MicrosoftWordHydratorState;
	setState: (newState: MicrosoftWordHydratorState) => void;

	documents: Array<File>;
	currentDocument?: File;
	addDocument: (document: File) => void;
	setCurrentDocument: (document?: File) => void;
};

export const useMicrosoftWordHydratorStore =
	createResettable<MicrosoftWordHydratorStore>(WIZARD_STORE_CATEGORY)(
		(set, get) => ({
			state: MicrosoftWordHydratorState.UPLOAD,
			setState: (ns) => set({ state: ns }),

			documents: [],
			addDocument: (document) =>
				set((state) => ({
					documents: state.documents.concat(document),
				})),
			setCurrentDocument: (document) => set({ currentDocument: document }),
		}),
	);
