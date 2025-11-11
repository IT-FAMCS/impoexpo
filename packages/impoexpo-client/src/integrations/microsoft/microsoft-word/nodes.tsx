import {
	registerCategory,
	registerWithDefaultRenderer,
} from "@/features/format-editor/nodes/renderable-node-database";
import type {
	NodePropertyMetadata,
	RawNodeRenderOptions,
} from "@/features/format-editor/nodes/renderable-node-types";
import {
	getNodeId,
	useFormatEditorStore,
} from "@/features/format-editor/stores/store";
import { Icon } from "@iconify/react";
import * as wordNodes from "@impoexpo/shared/nodes/integrations/microsoft/word";
import { createWordDocumentBaseNode } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import {
	nodesScope,
	registerBaseNodes,
} from "@impoexpo/shared/nodes/node-database";
import type { ObjectEntry } from "@impoexpo/shared/nodes/node-types";
import {
	type MicrosoftWordDocumentLayout,
	MicrosoftWordPlaceholderType,
} from "@impoexpo/shared/schemas/integrations/microsoft/word/MicrosoftWordLayoutSchema";
import { msg } from "@lingui/core/macro";
import type { ObjectEntries } from "valibot";

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
					__sorter: { title: msg`sorter` },
				};
				break;
			case MicrosoftWordPlaceholderType.GROUP:
				options.inputs = {
					__title: { title: msg`group title` },
					__sorter: { title: msg`sorter` },
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
};

nodesScope(() => {
	registerCategory("microsoft-word", {
		name: msg`Microsoft Word`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
		documentationLink: "/user/integrations/microsoft-word",
	});

	registerWithDefaultRenderer(wordNodes.WORD_TEXT_SORTER_NODE, {
		title: msg`sorter (text)`,
		aliases: msg`sort by text, sort, sorter by text`,
		inputs: {
			keys: {
				title: msg`comparison keys`,
				description: msg`if empty, will compare the values themselves. otherwise, sorts by the specified keys first.`,
			},
			reverse: { title: msg`reverse?` },
		},
		outputs: {
			sorter: { title: msg`sorter` },
		},
	});

	registerWithDefaultRenderer(wordNodes.WORD_NUMBERS_SORTER_NODE, {
		title: msg`sorter (numbers)`,
		aliases: msg`sort by value, sort, sorter by value, sort by number`,
		inputs: {
			keys: {
				title: msg`comparison keys`,
				description: msg`if empty, will compare the values themselves. otherwise, sorts by the specified keys first.`,
			},
			reverse: { title: msg`reverse?` },
		},
		outputs: {
			sorter: { title: msg`sorter` },
		},
	});

	registerWithDefaultRenderer(wordNodes.WORD_DATES_SORTER_NODE, {
		title: msg`sorter (dates)`,
		aliases: msg`sort by date, sort, sorter by date`,
		inputs: {
			keys: {
				title: msg`comparison keys`,
				description: msg`if empty, will compare the values themselves. otherwise, sorts by the specified keys first.`,
			},
			reverse: { title: msg`reverse?` },
		},
		outputs: {
			sorter: { title: msg`sorter` },
		},
	});
});
