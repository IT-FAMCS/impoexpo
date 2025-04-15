import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import { registerCategory } from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import * as operatorNodes from "@impoexpo/shared/nodes/builtin/operators";
import {
	registerSymmetricBinaryNode,
	registerSymmetricUnaryNode,
} from "../common";

nodesScope(() => {
	registerCategory("operators", {
		name: msg`operators`,
		header: "bg-success-200",
		icon: (size) => <Icon width={size} icon="mdi:code-brackets" />,
	});

	registerSymmetricBinaryNode(operatorNodes.EQUAL_NODE, {
		title: msg`equal`,
		aliases: [msg`same`],
		icon: (size) => <Icon width={size} icon="mdi:equal" />,
	});

	registerSymmetricBinaryNode(operatorNodes.AND_NODE, {
		title: msg`and`,
		aliases: ["&&"],
		icon: (size) => <Icon width={size} icon="mdi:ampersand" />,
	});

	registerSymmetricBinaryNode(operatorNodes.OR_NODE, {
		title: msg`or`,
		aliases: ["||"],
		icon: (size) => <Icon width={size} icon="mdi:drag-vertical-variant" />,
	});

	registerSymmetricUnaryNode(operatorNodes.NOT_NODE, {
		title: msg`not`,
		aliases: ["!"],
		icon: (size) => <Icon width={size} icon="mdi:exclamation" />,
	});

	registerSymmetricBinaryNode(operatorNodes.LESS_THAN_NODE, {
		title: msg`less than`,
		aliases: [msg`<`],
		icon: (size) => <Icon width={size} icon="mdi:less-than" />,
	});

	registerSymmetricBinaryNode(operatorNodes.LESS_OR_EQUAL_TO_NODE, {
		title: msg`less or equal to`,
		aliases: [msg`<=`],
		icon: (size) => <Icon width={size} icon="mdi:less-than-or-equal" />,
	});

	registerSymmetricBinaryNode(operatorNodes.GREATER_THAN_NODE, {
		title: msg`greater than`,
		aliases: [msg`>`],
		icon: (size) => <Icon width={size} icon="mdi:greater-than" />,
	});

	registerSymmetricBinaryNode(operatorNodes.GREATER_OR_EQUAL_TO_NODE, {
		title: msg`greater or equal to`,
		aliases: [msg`>=`],
		icon: (size) => <Icon width={size} icon="mdi:greater-than-or-equal" />,
	});
});
