import { create } from "zustand";

export type NewNodeInformation = {
	position: { x: number; y: number };
	fromNodeType?: string;
	fromHandleId?: string;
	fromNodeId?: string;
};

export type SearchNodesModalStore = {
	newNodeInformation: NewNodeInformation | undefined;
	setNewNodeInformation: (nni: NewNodeInformation | undefined) => void;
};

export const useSearchNodesModalStore = create<SearchNodesModalStore>(
	(set) => ({
		newNodeInformation: undefined,
		filters: [],
		setNewNodeInformation: (nni) => set(() => ({ newNodeInformation: nni })),
	}),
);
