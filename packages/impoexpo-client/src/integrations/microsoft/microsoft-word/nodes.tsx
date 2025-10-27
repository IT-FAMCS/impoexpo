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
import {
	type MicrosoftWordDocumentLayout,
	MicrosoftWordPlaceholderType,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import { createWordDocumentBaseNode } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import type {
	NodePropertyMetadata,
	RawNodeRenderOptions,
} from "@/features/format-editor/nodes/renderable-node-types";
import type { ObjectEntries } from "valibot";
import {
	getNodeId,
	useFormatEditorStore,
} from "@/features/format-editor/stores/store";
import type { ObjectEntry } from "@impoexpo/shared/nodes/node-types";

export const registerMicrosoftWordNode = (
	filename: string,
	identifier: string,
	layout: MicrosoftWordDocumentLayout,
	addNode = false,
) => {
	const data = createWordDocumentBaseNode(identifier, layout);

	const ids: Record<string, string> = {};
	for (const [key, placeholder] of Object.entries(data.placeholders)) {
		const options: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
			searchable: false,
			title: key,
			header: "bg-primary-200",
			icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
			outputs: {
				result: { title: msg`result` },
			},
		};

		switch (placeholder.layout.type) {
			case MicrosoftWordPlaceholderType.TEXT:
				options.inputs = {
					text: { title: msg`text` },
				};
				break;
			case MicrosoftWordPlaceholderType.LIST:
				options.inputs = {
					__automaticSeparators: {
						title: msg`automatically separate list items`,
						description: msg`automatically add a semicolon (;) to every list item except for the last one, which will have a dot (.) added instead.`,
					},
				};
				break;
			case MicrosoftWordPlaceholderType.GROUP:
				options.inputs = {
					__title: { title: msg`group title` },
				};
				break;
		}

		registerBaseNodes(placeholder.node);
		registerWithDefaultRenderer(placeholder.node, options);

		if (addNode) {
			const id = getNodeId(
				`${placeholder.node.category}-${placeholder.node.name}`,
			);
			ids[key] = id;
			useFormatEditorStore.setState((state) => ({
				nodes: state.nodes.concat({
					data: {},
					type: `${placeholder.node.category}-${placeholder.node.name}`,
					id: id,
					position: { x: 0, y: 0 },
				}),
			}));
		}
	}

	const options: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
		searchable: false,
		title: filename,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
		documentationHashOverride: "document",
		inputs: layout.placeholders.reduce(
			(acc, cur) => {
				acc[cur.name] = {
					title: cur.name,
					description:
						cur.description === "" || cur.description === null
							? undefined
							: cur.description,
				};
				return acc;
			},
			{} as Record<string, NodePropertyMetadata<ObjectEntry, true>>,
		),
	};
	registerBaseNodes(data.document);
	registerWithDefaultRenderer(data.document, options);

	if (addNode) {
		useFormatEditorStore.setState((state) => {
			const documentId = getNodeId(
				`${data.document.category}-${data.document.name}`,
			);
			state.nodes.push({
				data: {},
				type: `${data.document.category}-${data.document.name}`,
				id: documentId,
				position: { x: 0, y: 0 },
			});

			for (const [key, placeholder] of Object.entries(data.placeholders)) {
				state.edges.push({
					source: ids[key],
					sourceHandle: "result",
					target:
						placeholder.parent === "" ? documentId : ids[placeholder.parent],
					targetHandle: key,
					id: `${ids[key]}-${placeholder.parent === "" ? documentId : ids[placeholder.parent]}-${key}`,
				});
			}
		});
	}

	/* const options: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
		searchable: false,
		title: filename,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
		documentationHashOverride: "document",
		inputs: {},
	};


	registerBaseNodes(base);
	registerWithDefaultRenderer(base, options);

	if (addNode) {
		useFormatEditorStore.setState((state) => ({
			nodes: state.nodes.concat(),
		}));
	} */
};

nodesScope(() => {
	registerCategory("microsoft-word", {
		name: msg`Microsoft Word`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
		documentationLink: "/user/integrations/microsoft-word",
	});

	/* registerWithDefaultRenderer(wordNodes.WORD_TEXT_NODE, {
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
	}); */
});
