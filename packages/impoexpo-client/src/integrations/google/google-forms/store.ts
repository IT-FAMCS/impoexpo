import { WIZARD_STORE_CATEGORY, createResettable } from "@/stores/resettable";
import type { ListGoogleFormsResponseInstance } from "@impoexpo/shared";

export enum GoogleFormsHydratorState {
	SELECT = 0,
	VERIFY = 1,
}

export type GoogleFormsHydratorStore = {
	state: GoogleFormsHydratorState;
	currentForm?: ListGoogleFormsResponseInstance;
	usedForms: Set<ListGoogleFormsResponseInstance>;

	setState: (newState: GoogleFormsHydratorState) => void;
	setCurrentForm: (form?: ListGoogleFormsResponseInstance) => void;
	addUsedForm: (form: ListGoogleFormsResponseInstance) => void;
	hasForm: (id: string) => boolean;
};

export const useGoogleFormsHydratorStore =
	createResettable<GoogleFormsHydratorStore>(WIZARD_STORE_CATEGORY)(
		(set, get) => ({
			state: GoogleFormsHydratorState.SELECT,
			usedForms: new Set(),

			hasForm: (id: string) =>
				Array.from(get().usedForms).find((f) => f.id === id) !== undefined,
			addUsedForm: (form: ListGoogleFormsResponseInstance) =>
				set((st) => ({ usedForms: new Set(st.usedForms).add(form) })),
			setState: (newState: GoogleFormsHydratorState) =>
				set(() => ({ state: newState })),
			setCurrentForm: (form?: ListGoogleFormsResponseInstance) =>
				set(() => ({ currentForm: form })),
		}),
	);
