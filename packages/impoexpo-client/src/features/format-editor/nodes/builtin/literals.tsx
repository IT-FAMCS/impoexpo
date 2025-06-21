import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import * as literalNodes from "@impoexpo/shared/nodes/builtin/literals";
import { Icon } from "@iconify/react";

nodesScope(() => {
	registerCategory("literals", {
		name: msg`literals`,
		header: "bg-default-200",
		icon: (size) => <Icon width={size} icon="mdi:symbol" />,
	});

	registerWithDefaultRenderer(literalNodes.NUMBER_NODE, {
		title: msg`number`,
		icon: (size) => <Icon width={size} icon="mdi:123" />,
		inputs: { value: { mode: "independentOnly" } },
	});

	registerWithDefaultRenderer(literalNodes.STRING_NODE, {
		title: msg`string`,
		icon: (size) => <Icon width={size} icon="mdi:abc" />,
		inputs: { value: { mode: "independentOnly" } },
	});

	registerWithDefaultRenderer(literalNodes.BOOLEAN_NODE, {
		title: msg`boolean`,
		icon: (size) => <Icon width={size} icon="mdi:checkbox-outline" />,
		inputs: { value: { mode: "independentOnly" } },
	});
});
