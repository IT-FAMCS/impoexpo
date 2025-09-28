import { registerHandler } from "../../node-executor-utils";
import * as notificationsNodes from "@impoexpo/shared/nodes/builtin/notifications";

registerHandler(notificationsNodes.ERROR_NOTIFICATION_NODE, (ctx) => {
	if (ctx.message) ctx["~job"].notify("error", ctx.message);
});

registerHandler(notificationsNodes.WARNING_NOTIFICATION_NODE, (ctx) => {
	if (ctx.message) ctx["~job"].notify("warn", ctx.message);
});

registerHandler(notificationsNodes.INFORMATION_NOTIFICATION_NODE, (ctx) => {
	if (ctx.message) ctx["~job"].notify("info", ctx.message);
});
