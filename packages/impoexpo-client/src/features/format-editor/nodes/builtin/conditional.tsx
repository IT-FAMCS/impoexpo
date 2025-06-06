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
			value: {
				title: msg`value`,
			},
		},
	});

	registerWithDefaultRenderer(conditionalNodes.REPEAT_NODE, {
		title: msg`repeat X times...`,
		inputs: {
			times: {
				title: msg`amount of times`,
			},
		},
		outputs: {
			iteration: {
				title: msg`iteration`,
				description: msg`starting from 1`,
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

	registerWithDefaultRenderer(conditionalNodes.SKIP_ITERATION_IF_NODE, {
		title: msg`skip iteration, if...`,
		aliases: msg`skip, ignore`,
		header: "bg-danger-200",
		inputs: {
			condition: {
				title: msg`condition`,
				description: msg`must be connected to an iterator node, otherwise will never skip an iteration.`,
				mode: "dependentOnly",
			},
		},
	});
});
