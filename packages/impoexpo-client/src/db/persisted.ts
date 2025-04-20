import {
	TransferWizardStage,
	useTransferWizardStore,
} from "@/features/transfer-wizard/store";
import { globalDatabase } from "./global-database";
import {
	type PersistentGenericNodeData,
	useFormatEditorStore,
} from "@/features/format-editor/store";
import { useProjectStore } from "@/stores/project";
import type { Project } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { allIntegrations } from "@/integrations/integrations";
import type { Edge, Node } from "@xyflow/react";

export interface GlobalPersistedStateTable {
	type:
		| "project-state"
		| "wizard-state"
		| "editor-state"
		| "integrations-state";
	data: Record<string, unknown> | string;
}

export const saveStatesToDatabase = async () => {
	await globalDatabase.persisted.put({
		type: "wizard-state",
		data: TransferWizardStage[useTransferWizardStore.getState().stage],
	});

	await globalDatabase.persisted.put({
		type: "editor-state",
		data: {
			nodes: useFormatEditorStore.getState().nodes,
			edges: useFormatEditorStore.getState().edges,
			genericNodes: useFormatEditorStore.getState().genericNodes,
		},
	});

	await globalDatabase.persisted.put({
		type: "project-state",
		data: {
			nodes: useProjectStore.getState().nodes,
			integrations: useProjectStore.getState().integrations,
		},
	});

	const integrationsState: Record<string, Record<string, unknown>> = {};
	const prevIntegrationsState = (
		await globalDatabase.persisted.get("integrations-state")
	)?.data;

	for (const integration of allIntegrations.filter(
		(i) => i.getPersistentInformation && i.onPersistentInformationLoaded,
	)) {
		const prevInformation =
			prevIntegrationsState &&
			typeof prevIntegrationsState === "object" &&
			integration.id in prevIntegrationsState
				? (prevIntegrationsState[integration.id] as Record<string, unknown>)
				: undefined;
		integrationsState[integration.id] =
			// biome-ignore lint/style/noNonNullAssertion: filtered in the for loop
			integration.getPersistentInformation!(prevInformation);
	}
	await globalDatabase.persisted.put({
		type: "integrations-state",
		data: integrationsState,
	});
};

export const loadStatesFromDatabase = async () => {
	// NOTE: DO NOT CHANGE THE ORDER OF STATES LOADED HERE

	const integrationsState =
		await globalDatabase.persisted.get("integrations-state");
	if (integrationsState && typeof integrationsState.data === "object") {
		for (const id in integrationsState.data) {
			const integration = allIntegrations.find((i) => i.id === id);
			if (!integration || !integration.onPersistentInformationLoaded) continue;
			integration.onPersistentInformationLoaded(
				integrationsState.data[id] as Record<string, unknown>,
			);
		}
	}

	const editorState = await globalDatabase.persisted.get("editor-state");
	if (editorState && typeof editorState.data === "object") {
		if ("nodes" in editorState.data)
			useFormatEditorStore
				.getState()
				.setNodes(editorState.data.nodes as Node[]);
		if ("edges" in editorState.data)
			useFormatEditorStore
				.getState()
				.setEdges(editorState.data.edges as Edge[]);
		if ("genericNodes" in editorState.data)
			useFormatEditorStore
				.getState()
				.recoverGenericNodes(
					editorState.data.genericNodes as PersistentGenericNodeData,
				);
	}

	const projectState = await globalDatabase.persisted.get("project-state");
	if (projectState) {
		useProjectStore.setState(() => projectState.data as Partial<Project>);
	}

	const wizardState = await globalDatabase.persisted.get("wizard-state");
	if (wizardState) {
		useTransferWizardStore
			.getState()
			.setStage(
				TransferWizardStage[
					wizardState.data as keyof typeof TransferWizardStage
				],
			);
	}
};

export const clearStatesFromDatabase = async () => {
	await globalDatabase.persisted.delete("wizard-state");
	await globalDatabase.persisted.delete("editor-state");
	await globalDatabase.persisted.delete("project-state");
	await globalDatabase.persisted.delete("integrations-state");
};
