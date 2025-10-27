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
		inputs: { value: { mode: "independentOnly", title: msg`value` } },
		outputs: { number: { title: msg`number` } },
	});

	registerWithDefaultRenderer(literalNodes.STRING_NODE, {
		title: msg`string`,
		icon: (size) => <Icon width={size} icon="mdi:abc" />,
		inputs: { value: { mode: "independentOnly", title: msg`value` } },
		outputs: { string: { title: msg`string` } },
	});

	registerWithDefaultRenderer(literalNodes.BOOLEAN_NODE, {
		title: msg`boolean`,
		icon: (size) => <Icon width={size} icon="mdi:checkbox-outline" />,
		inputs: { value: { mode: "independentOnly", title: msg`value` } },
		outputs: { boolean: { title: msg`boolean` } },
	});

	registerWithDefaultRenderer(literalNodes.DATE_TIME_NODE, {
		title: msg`date`,
		icon: (size) => <Icon width={size} icon="mdi:calendar" />,
		inputs: { value: { mode: "independentOnly", title: msg`value` } },
		outputs: { dateTime: { title: msg`date` } },
	});

	registerWithDefaultRenderer(literalNodes.ARRAY_NODE, {
		title: msg`array`,
		icon: (size) => <Icon width={size} icon="mdi:script-text-outline" />,
		inputs: { value: { mode: "independentOnly", title: msg`value` } },
		outputs: { array: { title: msg`array` } },
	});
});
