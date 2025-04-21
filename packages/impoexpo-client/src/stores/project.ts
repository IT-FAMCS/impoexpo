import { getNodeRenderOptions } from "@/features/format-editor/nodes/renderable-node-database";
import { useFormatEditorStore } from "@/features/format-editor/store";
import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type {
	Project,
	ProjectIntegration,
	ProjectNode,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import { create } from "zustand";

export type ProjectStoreActions = {
	hydrateNodes: () => void;
	setIntegrationData: (key: string, data: ProjectIntegration) => void;
	getIntegrationData: (key: string) => ProjectIntegration;
};

export const useProjectStore = create<Project & ProjectStoreActions>(
	(set, get) => ({
		integrations: {},
		nodes: [],

		getIntegrationData: (key) =>
			get().integrations[key] ?? { auth: {}, data: {} },
		setIntegrationData: (key, data) =>
			set({ integrations: { ...get().integrations, [key]: data } }),
		hydrateNodes() {
			const nodes: ProjectNode[] = [];
			const clientNodes = useFormatEditorStore.getState().nodes;
			const clientEdges = useFormatEditorStore.getState().edges;
			const genericNodes = useFormatEditorStore.getState().genericNodes;

			for (const clientNode of clientNodes) {
				if (!clientNode.type) continue;
				const type =
					clientNode.id in genericNodes
						? genericNodes[clientNode.id].base
						: clientNode.type;
				const base = getBaseNode(type);
				const options = getNodeRenderOptions(type);

				const node: ProjectNode = {
					id: clientNode.id,
					type: type,
					purpose: base.purpose,
					inputs: {},
					outputs: {},
				};

				if (base.inputSchema) {
					for (const entry of Object.keys(base.inputSchema?.entries ?? {})) {
						if (
							clientNode.data.entries &&
							entry in (clientNode.data.entries ?? {})
						) {
							node.inputs[entry] = clientNode.data.entries[entry];
							continue;
						}

						if (options.property(entry)?.mode === "independentOnly") continue;

						const edge = clientEdges.find((e) => e.target === clientNode.id);
						if (edge?.source && edge.sourceHandle) {
							node.inputs[entry] = {
								type: "dependent",
								source: { node: edge.source, entry: edge.sourceHandle },
							};
							continue;
						}

						console.warn(
							`couldn't hydrate project state with nodes: node "${clientNode.id}" (${clientNode.type}) doesn't have any value for the "${entry}" entry`,
						);
					}
				}

				if (base.outputSchema) {
					for (const entry of Object.keys(base.outputSchema?.entries ?? {})) {
						if (
							clientNode.data.entries &&
							entry in (clientNode.data.entries ?? {})
						) {
							node.outputs[entry] = clientNode.data.entries[entry];
							continue;
						}

						const edge = clientEdges.find((e) => e.source === clientNode.id);
						if (edge?.target && edge.targetHandle) {
							node.outputs[entry] = {
								type: "dependent",
								source: { node: edge.target, entry: edge.targetHandle },
							};
							continue;
						}

						console.warn(
							`couldn't hydrate project state with nodes: node "${clientNode.id}" (${clientNode.type}) doesn't have any value for the "${entry}" entry`,
						);
					}
				}

				nodes.push(node);
			}

			set({ nodes });
		},
	}),
);
