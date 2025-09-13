import { create } from "zustand";

export type DocumentationModalStore = {
	open?: (url: string) => void;
	setOpen: (open: (url: string) => void) => void;
};

export const useDocumentationModalStore = create<DocumentationModalStore>(
	(set) => ({
		setOpen: (open) => set({ open }),
	}),
);
