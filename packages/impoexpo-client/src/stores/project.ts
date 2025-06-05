import { getNodeRenderOptions } from "@/features/format-editor/nodes/renderable-node-database";
import { useFormatEditorStore } from "@/features/format-editor/store";
import { allIntegrations } from "@/integrations/integrations";
import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type {
	Project,
	ProjectIntegration,
	ProjectNode,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import { create } from "zustand";

export type ProjectStoreInternals = {
	collectNodes: () => void;
	collectIntegrations: () => Promise<void>;
	loaded: boolean;
};

export const useProjectStore = create<Project & ProjectStoreInternals>(
	(set, get) => ({
		loaded: false,
		integrations: {},
		nodes: [],

		async collectIntegrations() {
			const integrations: Record<string, ProjectIntegration> = {};
			for (const integration of allIntegrations) {
				if (!integration.getProjectInformation) continue;
				integrations[integration.id] =
					await integration.getProjectInformation();
			}
			set({ integrations });
		},

		collectNodes() {
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

						const edges = clientEdges.filter(
							(e) => e.target === clientNode.id && e.targetHandle === entry,
						);
						if (edges.length !== 0) {
							node.inputs[entry] = {
								type: "dependent",
								sources: edges.map((e) => ({
									node: e.source,
									entry: e.sourceHandle ?? "",
								})),
							};
							continue;
						}

						console.warn(
							`couldn't collect nodes for project state: node "${clientNode.id}" (${clientNode.type}) doesn't have any value for the "${entry}" entry`,
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

						const edges = clientEdges.filter(
							(e) => e.source === clientNode.id && e.sourceHandle === entry,
						);
						if (edges.length !== 0) {
							node.outputs[entry] = {
								type: "dependent",
								sources: edges.map((e) => ({
									node: e.target,
									entry: e.targetHandle ?? "",
								})),
							};
							continue;
						}

						console.warn(
							`couldn't collect nodes for project state: node "${clientNode.id}" (${clientNode.type}) doesn't have any value for the "${entry}" entry`,
						);
					}
				}

				nodes.push(node);
			}

			set({ nodes });
		},
	}),
);
