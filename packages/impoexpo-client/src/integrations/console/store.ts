import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";

export type ConsoleIntegrationStore = {
	enabled: boolean;
	setEnabled: (enable: boolean) => void;
};

export const useConsoleIntegrationStore =
	createResettable<ConsoleIntegrationStore>(WIZARD_STORE_CATEGORY)((set) => ({
		enabled: false,
		setEnabled: (enable: boolean) => set(() => ({ enabled: enable })),
	}));
