import { WIZARD_STORE_CATEGORY, createResettable } from "@/stores/resettable";
import type { ListGoogleForm } from "@impoexpo/shared/schemas/integrations/google/forms/ListGoogleFormsResponseSchema";

export enum GoogleFormsHydratorState {
	SELECT = 0,
	VERIFY = 1,
	CREATE_LAYOUT_NODE = 2,
}

export type GoogleFormsHydratorStore = {
	state: GoogleFormsHydratorState;
	currentForm?: ListGoogleForm;
	usedForms: Set<ListGoogleForm>;

	setState: (newState: GoogleFormsHydratorState) => void;
	setCurrentForm: (form?: ListGoogleForm) => void;
	addUsedForm: (form: ListGoogleForm) => void;
	hasForm: (id: string) => boolean;
};

export const useGoogleFormsHydratorStore =
	createResettable<GoogleFormsHydratorStore>(WIZARD_STORE_CATEGORY)(
		(set, get) => ({
			state: GoogleFormsHydratorState.SELECT,
			usedForms: new Set(),

			hasForm: (id: string) =>
				Array.from(get().usedForms).find((f) => f.id === id) !== undefined,
			addUsedForm: (form: ListGoogleForm) =>
				set((st) => ({ usedForms: new Set(st.usedForms).add(form) })),
			setState: (newState: GoogleFormsHydratorState) =>
				set(() => ({ state: newState })),
			setCurrentForm: (form?: ListGoogleForm) =>
				set(() => ({ currentForm: form })),
		}),
	);
