import * as notificationNodes from "@impoexpo/shared/nodes/builtin/notifications";

import { Icon } from "@iconify/react";
import { msg } from "@lingui/core/macro";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-types";
import { nodesScope } from "@impoexpo/shared/nodes/node-database";

nodesScope(() => {
	registerCategory("notifications", msg`notifications`, (size) => (
		<Icon width={size} icon="mdi:message-badge" />
	));

	registerWithDefaultRenderer(notificationNodes.INFORMATION_NOTIFICATION_NODE, {
		title: msg`information`,
		categoryIcon: (size) => <Icon width={size} icon="mdi:information" />,
	});
	registerWithDefaultRenderer(notificationNodes.WARNING_NOTIFICATION_NODE, {
		title: msg`warning`,
		categoryIcon: (size) => <Icon width={size} icon="mdi:warning" />,
	});
	registerWithDefaultRenderer(notificationNodes.ERROR_NOTIFICATION_NODE, {
		title: msg`error`,
		categoryIcon: (size) => <Icon width={size} icon="mdi:error" />,
	});
});
