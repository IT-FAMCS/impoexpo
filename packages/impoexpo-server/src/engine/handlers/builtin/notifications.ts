import { registerHandler } from "../../node-handler-utils";
import * as notificationsNodes from "@impoexpo/shared/nodes/builtin/notifications";

registerHandler(notificationsNodes.ERROR_NOTIFICATION_NODE, (data, job) => {
	job.notify("error", data.message);
	return {};
});

registerHandler(notificationsNodes.WARNING_NOTIFICATION_NODE, (data, job) => {
	job.notify("warn", data.message);
	return {};
});

registerHandler(
	notificationsNodes.INFORMATION_NOTIFICATION_NODE,
	(data, job) => {
		job.notify("info", data.message);
		return {};
	},
);
