import * as notificationNodes from "@impoexpo/shared/nodes/builtin/notifications";
import { nodesScope } from "@impoexpo/shared/nodes/node-utils";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-types";
import { Icon } from "@iconify/react";

nodesScope(() => {
	registerCategory("notifications", "уведомления", (size) => (
		<Icon width={size} icon="mdi:message-badge" />
	));

	registerWithDefaultRenderer(notificationNodes.INFORMATION_NOTIFICATION_NODE, {
		title: "информация",
		categoryIcon: (size) => <Icon width={size} icon="mdi:information" />,
	});
	registerWithDefaultRenderer(notificationNodes.WARNING_NOTIFICATION_NODE, {
		title: "предупреждение",
		categoryIcon: (size) => <Icon width={size} icon="mdi:warning" />,
	});
	registerWithDefaultRenderer(notificationNodes.ERROR_NOTIFICATION_NODE, {
		title: "ошибка",
		categoryIcon: (size) => <Icon width={size} icon="mdi:error" />,
	});
});
