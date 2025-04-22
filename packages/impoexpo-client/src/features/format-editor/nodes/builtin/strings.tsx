import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";
import { nodesScope } from "@impoexpo/shared/nodes/node-database";

import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";

nodesScope(() => {
	registerCategory("string", {
		name: msg`strings`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:text" />,
	});

	registerWithDefaultRenderer(stringNodes.REPLACE_NODE, {
		title: msg`replace in string`,
		inputs: {
			string: { title: msg`string` },
			pattern: { title: msg`pattern` },
			replacement: { title: msg`replacement` },
		},
		outputs: {
			out: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.CONTAINS_NODE, {
		title: msg`string contains X?`,
		aliases: [msg`search in string`, msg`find in string`],
		inputs: {
			string: { title: msg`string` },
			pattern: { title: msg`pattern` },
		},
		outputs: {
			out: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.LENGTH_NODE, {
		title: msg`length of string`,
		inputs: {
			string: { title: msg`string` },
		},
		outputs: {
			out: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.JOIN_STRINGS_NODE, {
		title: msg`join strings`,
		aliases: [msg`combine strings`],
		inputs: {
			stringA: { title: "A" },
			stringB: { title: "B" },
			delimiter: { title: msg`delimeter (optional)` },
		},
		outputs: {
			out: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.NUMBER_TO_STRING_NODE, {
		title: msg`number -> string`,
		inputs: {
			number: { title: msg`number` },
		},
		outputs: {
			out: { title: msg`string` },
		},
	});
});
