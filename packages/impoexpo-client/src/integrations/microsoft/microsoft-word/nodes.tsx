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
import type { MicrosoftOfficeDocumentLayout } from "@impoexpo/shared/schemas/integrations/microsoft/MicrosoftOfficeLayoutSchema";
import { createWordDocumentBaseNode } from "@impoexpo/shared/nodes/integrations/microsoft/word";
import type { RawNodeRenderOptions } from "@/features/format-editor/nodes/renderable-node-types";
import type { ObjectEntries } from "valibot";
import {
	getNodeId,
	useFormatEditorStore,
} from "@/features/format-editor/store";

export const registerMicrosoftWordNode = (
	filename: string,
	identifier: string,
	layout: MicrosoftOfficeDocumentLayout,
) => {
	const base = createWordDocumentBaseNode(identifier, layout);
	const options: RawNodeRenderOptions<ObjectEntries, ObjectEntries> = {
		searchable: false,
		title: filename,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
		inputs: {},
	};
	for (const placeholder of layout.placeholders) {
		if (!options.inputs) continue;
		options.inputs[placeholder.formattedName] = {
			title: placeholder.formattedName,
			description: placeholder.description ?? undefined,
		};
	}

	registerBaseNodes(base);
	registerWithDefaultRenderer(base, options);

	useFormatEditorStore.setState((state) => ({
		nodes: state.nodes.concat({
			data: {},
			type: `${base.category}-${base.name}`,
			id: getNodeId(`${base.category}-${base.name}`),
			position: { x: 300, y: 100 }, // TODO
		}),
	}));
};

nodesScope(() => {
	registerCategory("microsoft-word", {
		name: msg`Microsoft Word`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:microsoft-word" />,
	});

	registerWithDefaultRenderer(wordNodes.WORD_TEXT_NODE, {
		title: msg`text`,
		inputs: {
			text: { title: msg`text`, separate: "after" },
			bold: { title: msg`bold?` },
			italics: { title: msg`italics?` },
			strikethrough: { title: msg`strikethrough?` },
			underline: { title: msg`underline?` },
		},
		outputs: {
			run: { title: msg`text run`, separate: "before" },
		},
	});

	registerWithDefaultRenderer(wordNodes.WORD_LIST_NODE, {
		title: msg`unordered list`,
		inputs: {
			runs: { title: msg`runs` },
			alignment: {
				title: msg`alignment`,
				description: msg`alignment of the text inside the list`,
				mode: "independentOnly",
				options: {
					start: { title: msg`start` },
					end: { title: msg`end` },
					center: { title: msg`center` },
				},
			},
			style: {
				title: "level format",
				description: msg`style of numbers/bullet points`,
				mode: "independentOnly",
				options: {
					"alpha-lowercase-dot": { title: "a. Lorem ipsum dolor sit amet..." },
					"alpha-uppercase-dot": { title: "A. Lorem ipsum dolor sit amet..." },
					"alpha-lowercase-parentheses": {
						title: "a) Lorem ipsum dolor sit amet...",
					},
					"alpha-uppercase-parentheses": {
						title: "A) Lorem ipsum dolor sit amet...",
					},
					"digit-dot": { title: "1. Lorem ipsum dolor sit amet..." },
					"digit-parentheses": { title: "1) Lorem ipsum dolor sit amet..." },
					"roman-lowercase": { title: "i. Lorem ipsum dolor sit amet..." },
					"roman-uppercase": { title: "I. Lorem ipsum dolor sit amet..." },

					"bullet-dot": { title: "• Lorem ipsum dolor sit amet..." },
					"bullet-triangle": { title: "‣ Lorem ipsum dolor sit amet..." },
					"bullet-hyphen": { title: "⁃ Lorem ipsum dolor sit amet..." },
				},
			},
		},
		outputs: {
			run: { title: msg`list run` },
		},
	});
});
