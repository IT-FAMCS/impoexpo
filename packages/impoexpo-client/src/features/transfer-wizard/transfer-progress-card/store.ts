import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import type { ProjectStatusNotification } from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";

export enum TransferProgressCardState {
	UPLOADING_PROJECT = 0,
	TRANSFERRING = 1,
}

export type TransferProgressCardStore = {
	state: TransferProgressCardState;
	jobId?: string;
	setState: (ns: TransferProgressCardState) => void;
	setJobId: (id: string) => void;
};

export const useTransferProgressCardStore =
	createResettable<TransferProgressCardStore>(WIZARD_STORE_CATEGORY)((set) => ({
		state: TransferProgressCardState.UPLOADING_PROJECT,
		jobId: undefined,
		setState: (ns) => set({ state: ns }),
		setJobId: (id) => set({ jobId: id }),
	}));

export type ProjectStatusCardStore = {
	open: boolean;
	error?: string;
	notifications: Record<string, ProjectStatusNotification>;

	setOpen: (open: boolean) => void;
	setError: (error?: string) => void;
	addNotification: (
		id: string,
		notification: ProjectStatusNotification,
	) => void;
};

export const useProjectStatusCardStore =
	createResettable<ProjectStatusCardStore>(WIZARD_STORE_CATEGORY)((set) => ({
		open: false,
		error: undefined,
		notifications: {},

		setOpen: (open) => set({ open }),
		setError: (error) => set({ error }),
		addNotification: (id, notification) =>
			set((state) => ({
				notifications: { ...state.notifications, [id]: notification },
			})),
	}));
