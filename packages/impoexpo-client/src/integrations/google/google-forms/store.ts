import { getAuthFromDatabase } from "@/db/auth";
import { useProjectStore } from "@/stores/project";
import { WIZARD_STORE_CATEGORY, createResettable } from "@/stores/resettable";
import type { GoogleFormsLayout } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import type { GoogleFormsProjectIntegration } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsProjectIntegrationSchema";
import type { ListGoogleForm } from "@impoexpo/shared/schemas/integrations/google/forms/ListGoogleFormsResponseSchema";
import { GoogleExchangeResponseSchema } from "@impoexpo/shared/schemas/integrations/google/GoogleExchangeResponseSchema";

export enum GoogleFormsHydratorState {
	SELECT = 0,
	VERIFY = 1,
	CREATE_LAYOUT_NODE = 2,
}

export type GoogleFormsHydratorStore = {
	state: GoogleFormsHydratorState;
	currentForm?: ListGoogleForm;
	usedForms: Record<string, GoogleFormsLayout>;

	setState: (newState: GoogleFormsHydratorState) => void;
	setCurrentForm: (form?: ListGoogleForm) => void;
	addUsedForm: (id: string, form: GoogleFormsLayout) => void;
	hasForm: (id: string) => boolean;
};

export const useGoogleFormsHydratorStore =
	createResettable<GoogleFormsHydratorStore>(WIZARD_STORE_CATEGORY)(
		(set, get) => ({
			state: GoogleFormsHydratorState.SELECT,
			usedForms: {},

			hasForm: (id: string) =>
				Object.keys(get().usedForms).find((key) => key === id) !== undefined,
			addUsedForm: (id: string, form: GoogleFormsLayout) =>
				set((st) => ({ ...st, usedForms: { ...st.usedForms, [id]: form } })),
			setState: (newState: GoogleFormsHydratorState) =>
				set(() => ({ state: newState })),
			setCurrentForm: (form?: ListGoogleForm) =>
				set(() => ({ currentForm: form })),
		}),
	);

export const addFormToProjectStore = (formId: string) => {
	const integrationData = useProjectStore
		.getState()
		.getIntegrationData("google-forms")
		.data as GoogleFormsProjectIntegration["data"];
	if (!integrationData.forms)
		Object.assign(integrationData, { forms: [formId] });
	else integrationData.forms = [...integrationData.forms, formId];
	getAuthFromDatabase("google", GoogleExchangeResponseSchema).then((value) => {
		if (!value) return;
		useProjectStore.getState().setIntegrationData("google-forms", {
			auth: { tokens: value.tokens },
			data: integrationData,
		} satisfies GoogleFormsProjectIntegration);
	});
};
