import type { ProjectNodeEntry } from "@impoexpo/shared/schemas/project/ProjectSchema";
import { useFormatEditorStore } from "./store";

export const setNodeEntryIndependentValue = (
	id: string,
	entry: string,
	value: unknown,
) => {
	updateNodeEntryProperty(id, entry, "value", value);
	updateNodeEntryProperty(id, entry, "type", "independent");
};

export const setNodeEntryDependentValue = (
	source: string,
	sourceHandle: string,
	target: string,
	targetHandle: string,
) => {
	removeNodeEntryProperty(source, sourceHandle, "value");
	const sourceEntry = getNodeEntry(source, sourceHandle);
	updateNodeEntryProperty(source, sourceHandle, "sources", [
		...(sourceEntry?.sources ?? []),
		{ node: target, entry: targetHandle },
	]);
};

export const removeNodeEntry = (id: string, entry: string) => {
	const index = useFormatEditorStore
		.getState()
		.nodes.findIndex((n) => n.id === id);
	if (index === -1) return;
	useFormatEditorStore.setState((state) => {
		if (
			!state.nodes[index].data.entries ||
			!(entry in state.nodes[index].data.entries)
		)
			return;
		delete state.nodes[index].data.entries[entry];
	});
};

export const removeNodeEntryProperty = <TKey extends keyof ProjectNodeEntry>(
	id: string,
	entry: string,
	key: TKey,
) => updateNodeEntryProperty(id, entry, key, undefined);

export const getNodeEntry = (
	id: string,
	entry: string,
): ProjectNodeEntry | undefined => {
	const state = useFormatEditorStore.getState();
	const index = state.nodes.findIndex((n) => n.id === id);
	if (index === -1) return undefined;
	const entries = state.nodes[index].data.entries;
	if (!entries || !(entry in entries)) return undefined;
	return entries[entry];
};

export const getNodeEntryProperty = <TKey extends keyof ProjectNodeEntry>(
	id: string,
	entry: string,
	key: TKey,
): ProjectNodeEntry[TKey] | undefined => getNodeEntry(id, entry)?.[key];

export const updateNodeEntryProperty = <TKey extends keyof ProjectNodeEntry>(
	id: string,
	entry: string,
	key: TKey,
	obj?: ProjectNodeEntry[TKey] extends Record<string, unknown>
		? Partial<ProjectNodeEntry[TKey]>
		: ProjectNodeEntry[TKey],
) => {
	const index = useFormatEditorStore
		.getState()
		.nodes.findIndex((n) => n.id === id);
	if (index === -1) return;
	useFormatEditorStore.setState((state) => {
		state.nodes[index].data.entries ??= {};
		const prev = state.nodes[index].data.entries[entry];
		state.nodes[index].data.entries[entry] = {
			...prev,
			[key]: obj,
		};
	});
};
