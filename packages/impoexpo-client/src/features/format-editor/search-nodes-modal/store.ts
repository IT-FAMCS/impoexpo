import { create } from "zustand";

export type SearchNodesModalStore = {
	filters: string[];
	setFilters: (newFilters: string[]) => void;
	addFilters: (newFilters: string[]) => void;
};

export const useSearchNodesModalStore = create<SearchNodesModalStore>(
	(set) => ({
		filters: [],
		setFilters: (newFilters) => set(() => ({ filters: newFilters })),
		addFilters: (newFilters) =>
			set((state) => ({ filters: [...state.filters, ...newFilters] })),
	}),
);
