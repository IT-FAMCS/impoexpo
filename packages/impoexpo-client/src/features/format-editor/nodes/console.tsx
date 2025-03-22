import { nodes, nodesScope } from "@impoexpo/shared";
import {
	registerCategoryIconRenderer,
	registerWithDefaultRenderer,
} from "./renderable-node-types";
import { Icon } from "@iconify/react";

nodesScope(() => {
	registerWithDefaultRenderer(nodes.base.console.CONSOLE_WRITE_NODE, {
		title: "вывод в консоль",
		properties: {
			text: { title: "текст" },
		},
	});

	registerWithDefaultRenderer(nodes.base.console.TESTING_NODE, {
		title: "testing node",
		properties: {
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

	registerCategoryIconRenderer("console", <Icon icon="mdi:console" />);
});
