import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import { registerCategory } from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";
import {
	registerSymmetricBinaryNode,
	registerSymmetricUnaryNode,
} from "../common";

nodesScope(() => {
	registerCategory("math", {
		name: msg`math`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:plus-minus-variant" />,
	});

	registerSymmetricBinaryNode(mathNodes.ADD_NODE, {
		title: msg`add`,
		aliases: [msg`sum`],
	});
	registerSymmetricBinaryNode(mathNodes.SUBTRACT_NODE, {
		title: msg`subtract`,
	});
	registerSymmetricBinaryNode(mathNodes.MULTIPLY_NODE, {
		title: msg`multiply`,
	});
	registerSymmetricBinaryNode(mathNodes.DIVIDE_NODE, {
		title: msg`divide`,
	});
	registerSymmetricBinaryNode(mathNodes.MODULO_NODE, {
		title: msg`modulo`,
		aliases: [msg`remainder`],
	});
	registerSymmetricBinaryNode(mathNodes.POWER_NODE, {
		title: msg`power`,
	});

	registerSymmetricUnaryNode(mathNodes.ABS_NODE, {
		title: msg`absolute value`,
		aliases: [msg`abs`],
	});
	registerSymmetricUnaryNode(mathNodes.LOG_NODE, { title: msg`log` });
	registerSymmetricUnaryNode(mathNodes.NEGATE_NODE, {
		title: msg`negate`,
	});
	registerSymmetricUnaryNode(mathNodes.SQUARE_ROOT_NODE, {
		title: msg`square root`,
		aliases: [msg`sqrt`],
	});
});
