// this isn't exactly related to the persisted iDB database
// but idk where to put it elsewhere

import { getNodeRenderOptions } from "@/features/format-editor/nodes/renderable-node-database";
import {
	EdgeSchema,
	PersistentGenericNodeDataSchema,
	ProjectNodeSchema,
	useFormatEditorStore,
} from "@/features/format-editor/store";
import { useProjectStore } from "@/stores/project";
import { getBaseNode } from "@impoexpo/shared/nodes/node-database";
import { ProjectSchema } from "@impoexpo/shared/schemas/project/ProjectSchema";
import * as v from "valibot";

export const EditorSchema = v.object({
	nodes: v.array(ProjectNodeSchema),
	edges: v.array(EdgeSchema),
	genericNodes: PersistentGenericNodeDataSchema,
});

// the only difference between "template" and "complete" snapshots is that
// the template snapshot does not include integration nodes, which means
// it can be shared between other users freely. complete snapshots are only meant
// to be stored in the iDB as "local projects"
export const PROJECT_SNAPSHOT_SCHEMA_VERSION = 1;
export const ProjectSnapshotSchema = v.object({
	type: v.picklist(["template", "complete"]),
	editor: EditorSchema,
	project: ProjectSchema,
	schemaVersion: v.literal(PROJECT_SNAPSHOT_SCHEMA_VERSION),
});
export type ProjectSnapshot = v.InferOutput<typeof ProjectSnapshotSchema>;

export const applyProjectSnapshot = async (snapshot: ProjectSnapshot) => {
	useFormatEditorStore.getState().irreversibleAction(() => {
		useFormatEditorStore.setState({
			nodes: snapshot.editor.nodes,
			edges: snapshot.editor.edges,
			genericNodes: snapshot.editor.genericNodes,
		});
		useFormatEditorStore
			.getState()
			.recoverGenericNodes(snapshot.editor.genericNodes);
		useFormatEditorStore.getState().updateNodeCount();
	});
	useProjectStore.setState({
		loaded: false,
		nodes: snapshot.project.nodes,
		integrations: snapshot.project.integrations,
	});
};

export const createProjectSnapshot = async (
	type: "template" | "complete",
): Promise<ProjectSnapshot> => {
	const formatEditorStore = useFormatEditorStore.getState();
	await useProjectStore.getState().collectIntegrations();
	useProjectStore.getState().collectNodes();
	const projectStore = useProjectStore.getState();

	const current: v.InferInput<typeof ProjectSnapshotSchema> = {
		type: type,
		schemaVersion: PROJECT_SNAPSHOT_SCHEMA_VERSION,
		editor: {
			nodes: formatEditorStore.nodes,
			edges: formatEditorStore.edges,
			genericNodes: formatEditorStore.genericNodes,
		},
		project: {
			integrations: projectStore.integrations,
			nodes: projectStore.nodes,
		},
	};

	if (type === "template") {
		current.project.integrations = {};

		// todo: integration nodes which aren't searchable should be treated
		// as a separate type of node (probably). hiding them from search isn't a good criteria
		const integrationNodes = current.project.nodes
			.filter(
				(n) =>
					getBaseNode(n.type).integration &&
					!(getNodeRenderOptions(n.type).raw.searchable ?? true),
			)
			.map((n) => n.id);

		current.editor.nodes = current.editor.nodes.filter(
			(n) => integrationNodes.indexOf(n.id) === -1,
		);
		current.editor.genericNodes = Object.fromEntries(
			Object.entries(current.editor.genericNodes).filter(([key]) =>
				integrationNodes.indexOf(key),
			),
		);
		current.editor.edges = current.editor.edges.filter(
			(e) =>
				integrationNodes.indexOf(e.source) === -1 &&
				integrationNodes.indexOf(e.target) === -1,
		);

		current.project.nodes = current.project.nodes.filter(
			(n) => integrationNodes.indexOf(n.id) === -1,
		);
		// remove any connections to integration nodes as well
		for (const node of current.project.nodes) {
			for (const property of [
				...Object.values(node.inputs).filter((i) => i.sources),
				...Object.values(node.outputs).filter((i) => i.sources),
			]) {
				property.sources = (property.sources ?? []).filter(
					(s) => integrationNodes.indexOf(s.node) === -1,
				);
			}
		}
	}

	return current as ProjectSnapshot;
};
