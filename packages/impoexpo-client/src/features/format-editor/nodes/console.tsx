import { nodesScope } from "@impoexpo/shared/nodes/node-utils";
import * as consoleNodes from '@impoexpo/shared/nodes/builtin/console';
import {
	registerCategoryIconRenderer,
	registerWithDefaultRenderer,
} from "./renderable-node-types";
import { Icon } from "@iconify/react";

nodesScope(() => {
	registerWithDefaultRenderer(consoleNodes.CONSOLE_WRITE_NODE, {
		title: "вывод в консоль",
		inputs: {
			text: { title: "текст" },
		},
	});

	registerWithDefaultRenderer(consoleNodes.TESTING_INPUT_NODE, {
		title: "testing input node",
		inputs: {
			choice: {
				options: {
					test: {
						title: "test1",
						description: "next option won't have a description",
					},
					test2: { title: "no description!" },
					test3: { title: "test3", description: "the description is back!" },
				},
			},
			choiceEnum: {
				options: {
					meow: { title: "meow", description: "kitty" },
					bark: { title: "bark", description: "doggy" },
				},
			},
			str: {
				title: "string",
				placeholder: "enter a string (at least 5 characters)",
			},
			num: {
				title: "number",
				placeholder: "input a number",
			},
		},
	});

	registerWithDefaultRenderer(consoleNodes.TESTING_OUTPUT_NODE, {
		title: "testing output node",
		outputs: {
			numOut: { description: "yeah" },
			strOut: { description: "hell yeah!" },
		},
	});

	registerCategoryIconRenderer("console", <Icon icon="mdi:console" />);
});
