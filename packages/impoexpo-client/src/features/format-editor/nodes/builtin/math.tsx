import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import { registerCategory } from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";
import { registerBinaryNode, registerUnaryNode } from "../common";

nodesScope(() => {
	registerCategory("math", {
		name: msg`math`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:plus-minus-variant" />,
	});

	registerBinaryNode(mathNodes.ADD_NODE, {
		title: msg`add`,
		aliases: msg`sum`,
	});

	registerBinaryNode(mathNodes.SUBTRACT_NODE, {
		title: msg`subtract`,
	});
	registerBinaryNode(mathNodes.MULTIPLY_NODE, {
		title: msg`multiply`,
	});
	registerBinaryNode(mathNodes.DIVIDE_NODE, {
		title: msg`divide`,
	});
	registerBinaryNode(mathNodes.MODULO_NODE, {
		title: msg`modulo`,
		aliases: msg`remainder`,
	});
	registerBinaryNode(mathNodes.POWER_NODE, {
		title: msg`power`,
	});

	registerUnaryNode(mathNodes.ABS_NODE, {
		title: msg`absolute value`,
		aliases: msg`abs`,
	});
	registerUnaryNode(mathNodes.LOG_NODE, { title: msg`log` });
	registerUnaryNode(mathNodes.NEGATE_NODE, {
		title: msg`negate`,
	});
	registerUnaryNode(mathNodes.SQUARE_ROOT_NODE, {
		title: msg`square root`,
		aliases: msg`sqrt`,
	});
});
