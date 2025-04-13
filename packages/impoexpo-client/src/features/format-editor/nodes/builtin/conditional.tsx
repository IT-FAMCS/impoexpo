import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import * as conditionalNodes from "@impoexpo/shared/nodes/builtin/conditional";

nodesScope(() => {
	registerCategory("conditional", msg`conditional`, (size) => (
		<Icon width={size} icon="mdi:question-mark" />
	));

	registerWithDefaultRenderer(conditionalNodes.IF_NODE, {
		title: msg`if...`,
		searchable: true,
		header: "bg-warning-200",
		inputs: {
			condition: {
				mode: "dependentOnly",
				title: msg`condition`,
			},
			trueValue: {
				title: msg`value when true`,
			},
			falseValue: {
				title: msg`value when false`,
			},
		},
		outputs: {
			out: {
				title: msg`result`,
			},
		},
	});
});
