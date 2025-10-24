import * as wordNodes from "@impoexpo/shared/nodes/integrations/microsoft/word";
import {
	nodesScope,
	registerBaseNodes,
} from "@impoexpo/shared/nodes/node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "@/features/format-editor/nodes/renderable-node-database";
import type { MicrosoftWordDocumentLayout } from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import { createWordDocumentBaseNode } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import type { RawNodeRenderOptions } from "@/features/format-editor/nodes/renderable-node-types";
import type { ObjectEntries } from "valibot";
import {
	getNodeId,
	useFormatEditorStore,
} from "@/features/format-editor/stores/store";

export const registerMicrosoftWordNode = (
	filename: string,
	identifier: string,
	layout: MicrosoftWordDocumentLayout,
	addNode = false,
) => {
	const base = createWordDocumentBaseNode(identifier, layout);
	const options: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
		searchable: false,
		title: filename,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
		documentationHashOverride: "document",
		inputs: {},
	};
	for (const placeholder of layout.placeholders) {
		if (!options.inputs) continue;
		options.inputs[placeholder.name] = {
			title: placeholder.name,
			description:
				placeholder.description === "" || placeholder.description === null
					? undefined
					: placeholder.description,
		};
	}

	registerBaseNodes(base);
	registerWithDefaultRenderer(base, options);

	if (addNode) {
		useFormatEditorStore.setState((state) => ({
			nodes: state.nodes.concat({
				data: {},
				type: `${base.category}-${base.name}`,
				id: getNodeId(`${base.category}-${base.name}`),
				position: { x: 300, y: 100 }, // TODO
			}),
		}));
	}
};

nodesScope(() => {
	registerCategory("microsoft-word", {
		name: msg`Microsoft Word`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
		documentationLink: "/user/integrations/microsoft-word",
	});

	registerWithDefaultRenderer(wordNodes.WORD_TEXT_NODE, {
		title: msg`text`,
		inputs: {
			text: { title: msg`text` },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(wordNodes.WORD_LIST_NODE, {
		title: msg`list`,
		inputs: {
			items: { title: msg`items` },
			automaticSeparators: {
				title: msg`automatically separate list items`,
				description: msg`automatically add a semicolon (;) to every list item except for the last one, which will have a dot (.) added instead.`,
			},
			sublistTitle: { title: msg`list title` },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(wordNodes.WORD_GROUPED_LIST_NODE, {
		title: msg`grouped list`,
		inputs: {
			groups: { title: msg`groups` },
			automaticSeparators: {
				title: msg`automatically separate list items`,
				description: msg`automatically add a semicolon (;) to every list item except for the last one, which will have a dot (.) added instead.`,
			},
		},
		outputs: {
			result: { title: msg`result` },
		},
	});
});
