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
		title: "тестинг",
		properties: {
			choice: {
				options: {
					test: { title: "тест1", description: "след. будет без описания" },
					test2: { title: "без описания" },
					test3: { title: "тест3", description: "снова с описанием" },
				},
			},
			choiceEnum: {
				options: {
					meow: { title: "мяу", description: "котик" },
					bark: { title: "гав", description: "собакин" },
				},
			},
		},
	});

	registerCategoryIconRenderer("console", <Icon icon="mdi:console" />);
});
