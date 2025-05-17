import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import type { MicrosoftOfficeDocumentLayout } from "@impoexpo/shared/schemas/integrations/microsoft/MicrosoftOfficeLayoutSchema";

export enum MicrosoftWordHydratorState {
	UPLOAD = 0,
	LAYOUT = 1,
	VERIFY = 2,
}

export type MicrosoftOfficeDocument = {
	file: File;
	id: string;
	layout?: MicrosoftOfficeDocumentLayout;
};

export type MicrosoftWordHydratorStore = {
	state: MicrosoftWordHydratorState;
	setState: (newState: MicrosoftWordHydratorState) => void;

	documents: Array<MicrosoftOfficeDocument>;
	currentDocument?: MicrosoftOfficeDocument;
	addDocument: (document: MicrosoftOfficeDocument) => void;
	setCurrentDocument: (document?: MicrosoftOfficeDocument) => void;
};

export const useMicrosoftWordHydratorStore =
	createResettable<MicrosoftWordHydratorStore>(WIZARD_STORE_CATEGORY)(
		(set, get) => ({
			state: MicrosoftWordHydratorState.UPLOAD,
			setState: (ns) => set({ state: ns }),

			documents: [],
			addDocument: (document) =>
				set((state) =>
					state.documents.some((d) => d.id === document.id)
						? state
						: { documents: state.documents.concat(document) },
				),
			setCurrentDocument: (document) => set({ currentDocument: document }),
		}),
	);
