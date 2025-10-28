import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";
import { nodesScope } from "@impoexpo/shared/nodes/node-database";

import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";

nodesScope(() => {
	registerCategory("strings", {
		name: msg`strings`,
		header: "bg-primary-200",
		icon: (size) => <Icon width={size} icon="mdi:text" />,
	});

	registerWithDefaultRenderer(stringNodes.REPLACE_NODE, {
		title: msg`replace in string`,
		inputs: {
			string: { title: msg`string` },
			regex: { title: msg`regular expression` },
			replacement: { title: msg`replacement` },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.CONTAINS_NODE, {
		title: msg`string contains X?`,
		aliases: msg`search in string, find in string`,
		inputs: {
			string: { title: msg`string` },
			regex: { title: msg`regular expression` },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.LENGTH_NODE, {
		title: msg`length of string`,
		inputs: {
			string: { title: msg`string` },
		},
		outputs: {
			length: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.JOIN_STRINGS_NODE, {
		title: msg`join strings`,
		aliases: msg`combine strings, add strings`,
		inputs: {
			strings: { title: msg`strings` },
			delimiter: { title: msg`delimiter (optional)` },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.FORMAT_STRING_NODE, {
		title: msg`format string`,
		aliases: msg`template string`,
		inputs: {
			template: {
				title: msg`template`,
				description: msg`to create a placeholder, use '{NUMBER}', where NUMBER starts from 0.`,
				placeholder: msg`hi, '{0}'!`,
			},
			args: {
				title: msg`arguments`,
				description: msg`the order in which nodes are connected matters here!`,
			},
		},
		outputs: {
			result: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.SPLIT_STRING_NODE, {
		title: msg`split string`,
		aliases: msg`divide string, explode string`,
		inputs: {
			string: { title: msg`string` },
			regex: {
				title: msg`delimiter`,
				description: msg`(regular expression)`,
			},
		},
		outputs: {
			parts: { title: msg`parts` },
		},
	});

	registerWithDefaultRenderer(stringNodes.TRIM_STRING_NODE, {
		title: msg`trim string`,
		aliases: msg`cut string, remove spaces`,
		inputs: {
			string: { title: msg`string` },
			trimStart: { title: msg`trim start?` },
			trimEnd: { title: msg`trim end?` },
		},
		outputs: {
			result: { title: msg`result` },
		},
	});

	registerWithDefaultRenderer(stringNodes.FIND_NODE, {
		title: msg`find in string`,
		aliases: msg`match string, substring, find match`,
		inputs: {
			string: { title: msg`string` },
			regex: { title: msg`regular expression` },
		},
		outputs: {
			match: {
				title: msg`match`,
				description: msg`null will be returned if no match was found.`,
			},
		},
	});
});
