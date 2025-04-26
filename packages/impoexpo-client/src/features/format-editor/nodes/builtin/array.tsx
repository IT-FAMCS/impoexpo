import * as arrayNodes from "@impoexpo/shared/nodes/builtin/array";
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
});
