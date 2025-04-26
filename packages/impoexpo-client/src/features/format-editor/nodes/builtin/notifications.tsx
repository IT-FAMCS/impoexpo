import * as notificationNodes from "@impoexpo/shared/nodes/builtin/notifications";

import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";
import { nodesScope } from "@impoexpo/shared/nodes/node-database";

nodesScope(() => {
	registerCategory("notifications", {
		name: msg`notifications`,
		icon: (size) => <Icon width={size} icon="mdi:message-badge" />,
	});

	registerWithDefaultRenderer(notificationNodes.INFORMATION_NOTIFICATION_NODE, {
		title: msg`information`,
		header: "bg-success-200",
		icon: (size) => <Icon width={size} icon="mdi:information" />,
		inputs: {
			condition: { mode: "dependentOnly", title: msg`condition (optional)` },
		},
	});

	registerWithDefaultRenderer(notificationNodes.WARNING_NOTIFICATION_NODE, {
		title: msg`warning`,
		header: "bg-warning-200",
		icon: (size) => <Icon width={size} icon="mdi:warning" />,
		inputs: {
			condition: { mode: "dependentOnly", title: msg`condition (optional)` },
		},
	});

	registerWithDefaultRenderer(notificationNodes.ERROR_NOTIFICATION_NODE, {
		title: msg`error`,
		header: "bg-danger-200",
		icon: (size) => <Icon width={size} icon="mdi:error" />,
		inputs: {
			condition: { mode: "dependentOnly", title: msg`condition (optional)` },
		},
	});
});
