import { create } from "zustand";

export type NewNodeInformation = {
	position: { x: number; y: number };
	fromNodeType?: string;
	fromHandleId?: string;
	fromNodeId?: string;
};

export type SearchNodesModalStore = {
	filters: string[];
	newNodeInformation: NewNodeInformation | undefined;
	setNewNodeInformation: (nni: NewNodeInformation | undefined) => void;
	setFilters: (newFilters: string[]) => void;
	addFilters: (newFilters: string[]) => void;
};

export const useSearchNodesModalStore = create<SearchNodesModalStore>(
	(set) => ({
		newNodeInformation: undefined,
		filters: [],
		setNewNodeInformation: (nni) => set(() => ({ newNodeInformation: nni })),
		setFilters: (newFilters) => set(() => ({ filters: newFilters })),
		addFilters: (newFilters) =>
			set((state) => ({ filters: [...state.filters, ...newFilters] })),
	}),
);
