import { nodesScope } from "@impoexpo/shared/nodes/node-utils";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-types";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";
import type { MessageDescriptor } from "@lingui/core";

nodesScope(() => {
	registerCategory("math", msg`math`, (size) => (
		<Icon width={size} icon="mdi:plus-minus-variant" />
	));

	type BinaryNode = typeof mathNodes.ADD_NODE;
	const registerBinaryNode = (
		node: BinaryNode,
		title: MessageDescriptor | string,
		aliases?: (MessageDescriptor | string)[],
	) => {
		registerWithDefaultRenderer(node, {
			title: title,
			aliases: aliases,
			headerColor: "bg-primary-200",
			searchable: true,
			inputs: {
				inA: { title: "A" },
				inB: { title: "B" },
			},
			outputs: {
				out: { title: msg`result` },
			},
		});
	};

	type UnaryNode = typeof mathNodes.ABS_NODE;
	const registerUnaryNode = (
		node: UnaryNode,
		title: MessageDescriptor | string,
		aliases?: (MessageDescriptor | string)[],
	) => {
		registerWithDefaultRenderer(node, {
			title: title,
			aliases: aliases,
			headerColor: "bg-primary-200",
			searchable: true,
			inputs: {
				in: { title: msg`input` },
			},
			outputs: {
				out: { title: msg`result` },
			},
		});
	};

	registerBinaryNode(mathNodes.ADD_NODE, msg`add`, [msg`sum`]);
	registerBinaryNode(mathNodes.SUBTRACT_NODE, msg`subtract`);
	registerBinaryNode(mathNodes.MULTIPLY_NODE, msg`multiply`);
	registerBinaryNode(mathNodes.DIVIDE_NODE, msg`divide`);
	registerBinaryNode(mathNodes.MODULO_NODE, msg`modulo`, [msg`remainder`]);
	registerBinaryNode(mathNodes.POWER_NODE, msg`power`);

	registerUnaryNode(mathNodes.ABS_NODE, msg`absolute value`, [msg`abs`]);
	registerUnaryNode(mathNodes.LOG_NODE, msg`log`);
	registerUnaryNode(mathNodes.NEGATE_NODE, msg`negate`);
	registerUnaryNode(mathNodes.SQUARE_ROOT_NODE, msg`square root`, [msg`sqrt`]);
});
