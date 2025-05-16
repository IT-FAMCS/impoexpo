import { registerHandler } from "../../node-executor-utils";
import * as notificationsNodes from "@impoexpo/shared/nodes/builtin/notifications";

registerHandler(notificationsNodes.ERROR_NOTIFICATION_NODE, (ctx) => {
	ctx["~job"].notify("error", ctx.message);
	return {};
});

registerHandler(notificationsNodes.WARNING_NOTIFICATION_NODE, (ctx) => {
	ctx["~job"].notify("warn", ctx.message);
});

registerHandler(notificationsNodes.INFORMATION_NOTIFICATION_NODE, (ctx) => {
	ctx["~job"].notify("info", ctx.message);
});
