import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { registerWithDefaultRenderer } from "./renderable-node-database";
import type { IconRenderFunction } from "./renderable-node-types";
import type {
	binaryNode,
	binaryNodeWithDifferentOutput,
	unaryNode,
	unaryNodeWithDifferentOutput,
} from "@impoexpo/shared/nodes/common";

type BinaryNode =
	| ReturnType<typeof binaryNode>
	| ReturnType<typeof binaryNodeWithDifferentOutput>;
export const registerBinaryNode = (
	node: BinaryNode,
	data: {
		title: MessageDescriptor | string;
		aliases?: MessageDescriptor | string;
		icon?: IconRenderFunction;
		header?: string;
		searchable?: boolean;
	},
) => {
	registerWithDefaultRenderer(node, {
		...data,
		inputs: {
			inA: { title: "A" },
			inB: { title: "B" },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});
};

type UnaryNode =
	| ReturnType<typeof unaryNode>
	| ReturnType<typeof unaryNodeWithDifferentOutput>;
export const registerUnaryNode = (
	node: UnaryNode,
	data: {
		title: MessageDescriptor | string;
		aliases?: MessageDescriptor | string;
		icon?: IconRenderFunction;
		header?: string;
		searchable?: boolean;
	},
) => {
	registerWithDefaultRenderer(node, {
		...data,
		inputs: {
			in: { title: msg`input` },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});
};
