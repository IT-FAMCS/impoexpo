import { registerWithDefaultRenderer } from "@/features/format-editor/nodes/renderable-node-database";
import {
	getNodeId,
	useFormatEditorStore,
} from "@/features/format-editor/store";
import { Icon } from "@iconify/react";
import { registerBaseNodes } from "@impoexpo/shared/nodes/node-database";
import type { GoogleFormsLayout } from "@impoexpo/shared/schemas/integrations/google/forms/GoogleFormsLayoutSchema";
import type { ObjectEntries } from "valibot";
import type { RawNodeRenderOptions } from "@/features/format-editor/nodes/renderable-node-types";
import { createGoogleFormsBaseNode } from "@impoexpo/shared/nodes/integrations/google/google-forms";

export const registerGoogleFormNode = (id: string, form: GoogleFormsLayout) => {
	const base = createGoogleFormsBaseNode(id, form);

	const options: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
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

	registerBaseNodes(base);
	registerWithDefaultRenderer(base, options);

	useFormatEditorStore.setState((state) => ({
		nodes: state.nodes.concat({
			data: {},
			type: `${base.category}-${base.name}`,
			id: getNodeId(`${base.category}-${base.name}`),
			position: { x: 100, y: 100 }, // TODO
		}),
	}));
};
