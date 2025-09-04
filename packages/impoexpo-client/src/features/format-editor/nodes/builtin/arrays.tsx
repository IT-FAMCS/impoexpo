import * as arrayNodes from "@impoexpo/shared/nodes/builtin/arrays";
import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";

nodesScope(() => {
	registerCategory("array", {
		name: msg`array`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:script-text-outline" />,
	});

	registerWithDefaultRenderer(arrayNodes.ARRAY_LENGTH_NODE, {
		title: msg`length of array`,
		aliases: msg`size of array`,
		inputs: {
			array: { title: msg`array` },
		},
		outputs: {
			length: { title: msg`length` },
		},
	});

	registerWithDefaultRenderer(arrayNodes.ARRAY_FOREACH_NODE, {
		title: msg`iterate over elements of the array...`,
		aliases: msg`for each item in the array, foreach`,
		inputs: {
			array: { title: msg`array` },
		},
		outputs: {
			object: { title: msg`object` },
		},
	});

	registerWithDefaultRenderer(arrayNodes.ARRAY_IS_FIRST_NODE, {
		title: msg`is this the first iteration?`,
		aliases: msg`is first entry, is first object`,
		inputs: {
			object: {
				title: msg`object`,
				description: msg`must be connected to an iterator node. otherwise, will always return false.`,
				mode: "dependentOnly",
			},
		},
		outputs: {
			first: {
				title: msg`first iteration?`,
			},
		},
	});

	registerWithDefaultRenderer(arrayNodes.ARRAY_IS_LAST_NODE, {
		title: msg`is this the last iteration?`,
		aliases: msg`is last entry, is last object`,
		inputs: {
			object: {
				title: msg`object`,
				description: msg`must be connected to an iterator node. otherwise, will always return false.`,
				mode: "dependentOnly",
			},
		},
		outputs: {
			last: {
				title: msg`last iteration?`,
			},
		},
	});
});
