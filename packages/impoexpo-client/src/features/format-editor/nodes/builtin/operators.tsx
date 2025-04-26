import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import { registerCategory } from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import * as operatorNodes from "@impoexpo/shared/nodes/builtin/operators";
import { registerBinaryNode, registerUnaryNode } from "../common";

nodesScope(() => {
	registerCategory("operators", {
		name: msg`operators`,
		header: "bg-success-200",
		icon: (size) => <Icon width={size} icon="mdi:code-brackets" />,
	});

	registerBinaryNode(operatorNodes.EQUAL_NODE, {
		title: msg`equal`,
		aliases: msg`same`,
		icon: (size) => <Icon width={size} icon="mdi:equal" />,
	});

	registerBinaryNode(operatorNodes.AND_NODE, {
		title: msg`and`,
		aliases: msg`&&`,
		icon: (size) => <Icon width={size} icon="mdi:ampersand" />,
	});

	registerBinaryNode(operatorNodes.OR_NODE, {
		title: msg`or`,
		aliases: msg`||`,
		icon: (size) => <Icon width={size} icon="mdi:drag-vertical-variant" />,
	});

	registerUnaryNode(operatorNodes.NOT_NODE, {
		title: msg`not`,
		aliases: msg`negate, !`,
		icon: (size) => <Icon width={size} icon="mdi:exclamation" />,
	});

	registerBinaryNode(operatorNodes.LESS_THAN_NODE, {
		title: msg`less than`,
		aliases: msg`<, smaller`,
		icon: (size) => <Icon width={size} icon="mdi:less-than" />,
	});

	registerBinaryNode(operatorNodes.LESS_OR_EQUAL_TO_NODE, {
		title: msg`less or equal to`,
		aliases: msg`<=`,
		icon: (size) => <Icon width={size} icon="mdi:less-than-or-equal" />,
	});

	registerBinaryNode(operatorNodes.GREATER_THAN_NODE, {
		title: msg`greater than`,
		aliases: msg`>, larger`,
		icon: (size) => <Icon width={size} icon="mdi:greater-than" />,
	});

	registerBinaryNode(operatorNodes.GREATER_OR_EQUAL_TO_NODE, {
		title: msg`greater or equal to`,
		aliases: msg`>=`,
		icon: (size) => <Icon width={size} icon="mdi:greater-than-or-equal" />,
	});
});
