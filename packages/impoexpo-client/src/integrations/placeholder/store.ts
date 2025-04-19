import { WIZARD_STORE_CATEGORY, createResettable } from "@/stores/resettable";

export type PlaceholderIntegrationStore = {
	enabled: boolean;
	setEnabled: (enable: boolean) => void;
};

export const usePlaceholderIntegrationStore =
	createResettable<PlaceholderIntegrationStore>(WIZARD_STORE_CATEGORY)(
		(set) => ({
			enabled: false,
			setEnabled: (enable: boolean) => set(() => ({ enabled: enable })),
		}),
	);
