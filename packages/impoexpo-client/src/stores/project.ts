import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { create } from "zustand";

export const useProjectStore = create<Project>((set, get) => ({
	integrations: {},
}));
