import type { useDisclosure } from "@heroui/react";
import { create } from "zustand";

export type DocumentationModalStore = {
	url?: string;
	disclosure?: ReturnType<typeof useDisclosure>;

	setDisclosure: (d: ReturnType<typeof useDisclosure>) => void;
	setUrl: (u: string) => void;
};

export const useDocumentationModalStore = create<DocumentationModalStore>(
	(set) => ({
		setUrl: (u) => set({ url: u }),
		setDisclosure: (d) => set({ disclosure: d }),
	}),
);
