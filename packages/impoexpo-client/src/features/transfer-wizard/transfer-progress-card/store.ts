import { createResettable, WIZARD_STORE_CATEGORY } from "@/stores/resettable";
import type { ProjectOutput } from "@impoexpo/shared/schemas/project/ProjectSchema";
import type { ProjectStatusNotification } from "@impoexpo/shared/schemas/project/ProjectStatusSchemas";

export enum TransferProgressCardState {
	UPLOADING_PROJECT = 0,
	UPLOADING_PROJECT_FILES = 1,
	TRANSFERRING = 2,
	DONE = 3,
}

export type TransferProgressCardStore = {
	state: TransferProgressCardState;
	jobId?: string;
	outputs: ProjectOutput[];
	setState: (ns: TransferProgressCardState) => void;
	setJobId: (id: string) => void;
	setOutputs: (outputs: ProjectOutput[]) => void;
};

export const useTransferProgressCardStore =
	createResettable<TransferProgressCardStore>(WIZARD_STORE_CATEGORY)((set) => ({
		state: TransferProgressCardState.UPLOADING_PROJECT,
		jobId: undefined,
		outputs: [],
		setState: (ns) => set({ state: ns }),
		setJobId: (id) => set({ jobId: id }),
		setOutputs: (outputs) => set({ outputs }),
	}));

export type ProjectStatusCardStore = {
	open: boolean;
	reconnecting: boolean;
	message?: string;
	notifications: Record<string, ProjectStatusNotification>;
	result?: boolean;

	terminate: () => void;
	complete: () => void;

	setOpen: (open: boolean) => void;
	setReconnecting: (reconnecting: boolean) => void;
	setMessage: (message?: string) => void;
	addNotification: (
		id: string,
		notification: ProjectStatusNotification,
	) => void;
};

export const useProjectStatusCardStore =
	createResettable<ProjectStatusCardStore>(WIZARD_STORE_CATEGORY)((set) => ({
		open: false,
		reconnecting: false,
		notifications: {},
		outputs: [],

		terminate: () => set({ result: false }),
		complete: () => set({ result: true }),

		setOpen: (open) => set({ open }),
		setReconnecting: (reconnecting) => set({ reconnecting }),
		setMessage: (message) => set({ message }),
		addNotification: (id, notification) =>
			set((state) => ({
				notifications: { ...state.notifications, [id]: notification },
			})),
	}));
