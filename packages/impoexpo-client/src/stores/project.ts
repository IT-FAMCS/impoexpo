import { getNodeRenderOptions } from "@/features/format-editor/nodes/renderable-node-database";
import { useFormatEditorStore } from "@/features/format-editor/stores/store";
import { allIntegrations } from "@/integrations/integrations";
import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import type {
	Project,
	ProjectIntegration,
	ProjectNode,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import { createResettable, WIZARD_STORE_CATEGORY } from "./resettable";

export type ProjectStoreInternals = {
	collectNodes: () => void;
	collectIntegrations: () => Promise<void>;
	loaded: boolean;

	localProjectId?: string;
	setLocalProjectId: (id: string) => void;
};

export const useProjectStore = createResettable<
	Project & ProjectStoreInternals
>(WIZARD_STORE_CATEGORY)((set, _get) => ({
	loaded: false,
	integrations: {},
	nodes: [],
	setLocalProjectId: (localProjectId) => set({ localProjectId }),

	async collectIntegrations() {
		const integrations: Record<string, ProjectIntegration> = {};
		for (const integration of allIntegrations) {
			if (!integration.getProjectInformation) continue;
			const integrationInformation = await integration.getProjectInformation();
			if (
				integrationInformation &&
				Object.keys(integrationInformation).length !== 0
			)
				integrations[integration.id] = integrationInformation;
		}
		set({ integrations });
	},

	// TODO: right now, the editor state => project state conversion is a
	// one-way process. technically, not much information is lost, and with
	// some refactoring the editor state may be fully restored just from the
	// project state. this might be a good thing to do later
	collectNodes() {
		const nodes: ProjectNode[] = [];
		const clientNodes = useFormatEditorStore.getState().nodes;
		const clientEdges = useFormatEditorStore.getState().edges;
		const genericNodes = useFormatEditorStore.getState().genericNodes;

		for (const clientNode of clientNodes) {
			if (!clientNode.type) continue;
			const type = clientNode.type;
			const base = getBaseNode(type);
			const options = getNodeRenderOptions(type);
			const generics =
				clientNode.id in genericNodes ? genericNodes[clientNode.id] : undefined;

			const node: ProjectNode = {
				id: clientNode.id,
				type: type,
				inputs: {},
				outputs: {},
				generics,
			};

			if (base.inputSchema) {
				for (const entry of Object.keys(base.inputSchema?.entries ?? {})) {
					if (
						clientNode.data.entries &&
						entry in (clientNode.data.entries ?? {})
					)
						node.inputs[entry] = clientNode.data.entries[entry];

					if (options.property(entry)?.mode === "independentOnly") continue;

					const edges = clientEdges.filter(
						(e) => e.target === clientNode.id && e.targetHandle === entry,
					);
					if (edges.length !== 0) {
						node.inputs[entry] = {
							...(node.inputs[entry] ?? {}),
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
					)
						node.outputs[entry] = clientNode.data.entries[entry];

					const edges = clientEdges.filter(
						(e) => e.source === clientNode.id && e.sourceHandle === entry,
					);
					if (edges.length !== 0) {
						node.outputs[entry] = {
							...node.outputs[entry],
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
}));
