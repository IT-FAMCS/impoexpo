import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";
import { nodesScope } from "@impoexpo/shared/nodes/node-database";

import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-types";

nodesScope(() => {
	registerCategory("string", msg`strings`, (size) => (
		<Icon width={size} icon="mdi:text" />
	));

	registerWithDefaultRenderer(stringNodes.COMBINE_STRINGS_NODE, {
		title: msg`combine strings`,
		aliases: [msg`add strings`, msg`join strings`],
		header: "bg-primary-200",
		searchable: true,
		inputs: {
			stringA: { title: "A" },
			stringB: { title: "B" },
		},
		outputs: {
			out: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.REPLACE_NODE, {
		title: msg`replace in string`,
		header: "bg-primary-200",
		searchable: true,
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
		header: "bg-primary-200",
		searchable: true,
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
		header: "bg-primary-200",
		searchable: true,
		inputs: {
			string: { title: msg`string` },
		},
		outputs: {
			out: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.NUMBER_TO_STRING_NODE, {
		title: msg`number -> string`,
		header: "bg-primary-200",
		searchable: true,
		inputs: {
			number: { title: msg`number` },
		},
		outputs: {
			out: { title: msg`string` },
		},
	});

	registerWithDefaultRenderer(stringNodes.BOOLEAN_TO_STRING_NODE, {
		title: msg`boolean -> string`,
		header: "bg-primary-200",
		searchable: true,
		inputs: {
			boolean: { title: msg`boolean` },
			trueValue: { title: msg`"true" string` },
			falseValue: { title: msg`"false" string` },
		},
		outputs: {
			out: { title: msg`string` },
		},
	});
});
