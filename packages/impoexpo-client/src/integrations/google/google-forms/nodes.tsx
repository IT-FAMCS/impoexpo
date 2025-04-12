import {
	type RawNodeRenderOptions,
	registerWithDefaultRenderer,
} from "@/features/format-editor/nodes/renderable-node-types";
import { schemaFromString } from "@/features/format-editor/nodes/schema-from-string";
import {
	getNodeId,
	useFormatEditorStore,
} from "@/features/format-editor/store";
import { Icon } from "@iconify/react";
import {
	type AllowedObjectEntry,
	BaseNode,
} from "@impoexpo/shared/nodes/node-types";
import {
	nodesScope,
	registerBaseNodes,
} from "@impoexpo/shared/nodes/node-database";
import type { GoogleFormsLayout } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import { object } from "valibot";

export const registerGoogleFormNode = (id: string, form: GoogleFormsLayout) => {
	const entries: Record<string, AllowedObjectEntry> = {};
	for (const item of form.items) entries[item.id] = schemaFromString(item.type);
	const schema = object(entries);

	const base = new BaseNode({
		category: "google-forms",
		name: `form-${id}`,
		outputSchema: schema,
	});

	const options: RawNodeRenderOptions<
		Record<string, AllowedObjectEntry>,
		typeof schema.entries
	> = {
		searchable: false,
		title: form.title ?? form.documentTitle,
		header: "bg-secondary-200",
		icon: (size: number) => (
			<Icon width={size} icon="simple-icons:googleforms" />
		),
		outputs: {},
	};
	for (const item of form.items) {
		if (!options.outputs) continue;
		options.outputs[item.id] = {
			title: item.title ?? item.id,
			description: item.description ?? undefined,
		};
	}

	nodesScope(() => {
		registerBaseNodes(base);
		registerWithDefaultRenderer(base, options);
	});

	const type = `${base.category}-${base.name}`;
	const editorState = useFormatEditorStore.getState();
	editorState.setNodes(
		editorState.nodes.concat({
			data: {},
			type: type,
			id: getNodeId(type),
			position: { x: 100, y: 100 },
		}),
	);
};
