import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { registerWithDefaultRenderer } from "./renderable-node-database";
import type {
	symmetricBinaryNode,
	symmetricUnaryNode,
} from "@impoexpo/shared/nodes/common";
import type { IconRenderFunction } from "./renderable-node-types";

type BinaryNode = ReturnType<typeof symmetricBinaryNode>;
export const registerSymmetricBinaryNode = (
	node: BinaryNode,
	data: {
		title: MessageDescriptor | string;
		aliases?: (MessageDescriptor | string)[];
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
			out: { title: msg`result` },
		},
	});
};

type UnaryNode = ReturnType<typeof symmetricUnaryNode>;
export const registerSymmetricUnaryNode = (
	node: UnaryNode,
	data: {
		title: MessageDescriptor | string;
		aliases?: (MessageDescriptor | string)[];
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
			out: { title: msg`result` },
		},
	});
};
