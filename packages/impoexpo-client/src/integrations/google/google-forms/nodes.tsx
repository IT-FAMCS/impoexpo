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
import {
	createGoogleFormsBaseNode,
	createGoogleFormsResponseBaseNode,
} from "@impoexpo/shared/nodes/integrations/google/google-forms";
import { msg } from "@lingui/core/macro";
import type { DefaultBaseNode } from "@impoexpo/shared/nodes/node-utils";

export const registerGoogleFormNode = (id: string, form: GoogleFormsLayout) => {
	const base = createGoogleFormsBaseNode(id, form);
	const responseBase = createGoogleFormsResponseBaseNode(id, form);

	const options: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
		searchable: false,
		title: form.title ?? form.documentTitle,
		header: "bg-secondary-200",
		icon: (size: number) => (
			<Icon width={size} icon="simple-icons:googleforms" />
		),
		outputs: {
			responses: { title: msg`responses` },
		},
	};

	const responseOptions: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
		searchable: false,
		title: msg`response to "${form.title ?? form.documentTitle}"`,
		header: "bg-secondary-200",
		icon: (size: number) => (
			<Icon width={size} icon="simple-icons:googleforms" />
		),
		inputs: {
			response: { title: msg`response` },
		},
		outputs: {},
	};
	for (const item of form.items) {
		if (!responseOptions.outputs) continue;
		responseOptions.outputs[item.id] = {
			title: item.title ?? item.id,
			description: item.description ?? undefined,
		};
	}

	registerBaseNodes(base, responseBase);
	registerWithDefaultRenderer(base, options);
	registerWithDefaultRenderer(responseBase, responseOptions);

	const info = (node: DefaultBaseNode) => ({
		type: `${node.category}-${node.name}`,
		id: getNodeId(`${node.category}-${node.name}`),
	});
	const baseInfo = info(base);
	const responseInfo = info(responseBase);

	useFormatEditorStore.setState((state) => ({
		nodes: state.nodes.concat(
			{
				data: {},
				type: baseInfo.type,
				id: baseInfo.id,
				position: { x: 100, y: 100 }, // TODO
			},
			{
				data: {},
				type: responseInfo.type,
				id: responseInfo.id,
				position: { x: 150, y: 100 },
			},
		),
	}));
};
