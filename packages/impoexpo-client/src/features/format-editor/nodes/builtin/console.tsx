import * as consoleNodes from "@impoexpo/shared/nodes/builtin/console";
import { nodesScope } from "@impoexpo/shared/nodes/node-database";

import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";

nodesScope(() => {
	registerCategory("console", msg`console`, (size) => (
		<Icon width={size} icon="mdi:console" />
	));

	registerWithDefaultRenderer(consoleNodes.CONSOLE_WRITE_NODE, {
		title: msg`print to console`,
		inputs: {
			text: { title: msg`text` },
		},
	});

	registerWithDefaultRenderer(consoleNodes.TESTING_INPUT_NODE, {
		title: msg`testing input node`,
		searchable: false,
		inputs: {
			choice: {
				mode: "independentOnly",
				options: {
					test: {
						title: msg`test1`,
						description: msg`next option won't have a description`,
					},
					test2: { title: msg`no description!` },
					test3: {
						title: msg`test3`,
						description: msg`the description is back!`,
					},
				},
			},
			choiceEnum: {
				mode: "independentOnly",
				options: {
					meow: { title: msg`meow`, description: msg`kitty` },
					bark: { title: msg`bark`, description: msg`doggy` },
				},
			},
			str: {
				title: msg`string`,
				placeholder: msg`enter a string (at least 5 characters)`,
			},
			num: {
				title: msg`number`,
				placeholder: msg`input a number`,
			},
			bool: {
				title: msg`boolean`,
				mode: "independentOnly",
			},
			boolOptional: {
				title: msg`boolean (optional)`,
				mode: "hybrid",
			},
		},
	});

	registerWithDefaultRenderer(consoleNodes.TESTING_OUTPUT_NODE, {
		title: msg`testing output node`,
		searchable: false,
		outputs: {
			numOut: { description: msg`yeah` },
			strOut: { description: msg`hell yeah!` },
		},
	});
});
