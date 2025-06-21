import {
	FormatEditorWrapperState,
	TransferWizardStage,
	useFormatEditorWrapperStore,
	useTransferWizardStore,
} from "@/features/transfer-wizard/store";
import { globalDatabase } from "./global-database";
import {
	type PersistentGenericNodeData,
	useFormatEditorStore,
} from "@/features/format-editor/store";
import { useProjectStore } from "@/stores/project";
import {
	ProjectSchema,
	type Project,
} from "@impoexpo/shared/schemas/project/ProjectSchema";
import { allIntegrations } from "@/integrations/integrations";
import type { Edge, Node } from "@xyflow/react";
import * as v from "valibot";

export interface GlobalPersistedStateTable {
	type:
		| "project-state"
		| "wizard-state"
		| "editor-state"
		| "integrations-state";
	data: Record<string, unknown>;
}

export const saveStatesToDatabase = async () => {
	await globalDatabase.persisted.put({
		type: "wizard-state",
		data: {
			state: TransferWizardStage[useTransferWizardStore.getState().stage],
		},
	});

	await globalDatabase.persisted.put({
		type: "editor-state",
		data: {
			nodes: useFormatEditorStore.getState().nodes,
			edges: useFormatEditorStore.getState().edges,
			genericNodes: useFormatEditorStore.getState().genericNodes,
		},
	});

	useProjectStore.getState().collectNodes();
	await useProjectStore.getState().collectIntegrations();
	await globalDatabase.persisted.put({
		type: "project-state",
		data: {
			nodes: useProjectStore.getState().nodes,
			integrations: useProjectStore.getState().integrations,
		},
	});
};

export const loadStatesFromDatabase = async () => {
	const projectState = (await globalDatabase.persisted.get("project-state"))
		?.data;
	if (projectState && v.is(ProjectSchema, projectState)) {
		useProjectStore.setState({
			...(projectState as Project),
			loaded: true,
		});
		for (const id of Object.keys(projectState.integrations)) {
			const integration = allIntegrations.find((i) => i.id === id);
			if (!integration || !integration.onProjectInformationLoaded) continue;
			await integration.onProjectInformationLoaded(
				projectState.integrations[id],
			);
		}
	}

	const editorState = (await globalDatabase.persisted.get("editor-state"))
		?.data;
	if (editorState) {
		if ("nodes" in editorState)
			useFormatEditorStore.getState().setNodes(editorState.nodes as Node[]);
		if ("edges" in editorState)
			useFormatEditorStore.getState().setEdges(editorState.edges as Edge[]);
		if ("genericNodes" in editorState)
			useFormatEditorStore
				.getState()
				.recoverGenericNodes(
					editorState.genericNodes as PersistentGenericNodeData,
				);
	}

	const wizardState = await globalDatabase.persisted.get("wizard-state");
	if (wizardState) {
		const stage =
			TransferWizardStage[
				wizardState.data.state as keyof typeof TransferWizardStage
			];
		useTransferWizardStore.getState().setStage(stage);
		if (stage === TransferWizardStage.FORMAT)
			useFormatEditorWrapperStore
				.getState()
				.setState(FormatEditorWrapperState.IN);
	}
};

export const clearStatesFromDatabase = async () => {
	await globalDatabase.persisted.delete("wizard-state");
	await globalDatabase.persisted.delete("editor-state");
	await globalDatabase.persisted.delete("project-state");
};
