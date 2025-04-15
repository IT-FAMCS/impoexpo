import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import * as conditionalNodes from "@impoexpo/shared/nodes/builtin/conditional";

nodesScope(() => {
	registerCategory("conditional", {
		name: msg`conditional`,
		header: "bg-warning-200",
		icon: (size) => <Icon width={size} icon="mdi:question-mark" />,
	});

	registerWithDefaultRenderer(conditionalNodes.IF_NODE, {
		title: msg`if...`,
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

	registerWithDefaultRenderer(conditionalNodes.THROW_ERROR_IF_NULL_NODE, {
		title: msg`throw error if null`,
		inputs: {
			nullableObject: {
				title: msg`nullable object`,
			},
			errorMessage: {
				title: msg`error message`,
				mode: "independentOnly",
			},
		},
		outputs: {
			object: {
				title: msg`object`,
			},
		},
	});
});
