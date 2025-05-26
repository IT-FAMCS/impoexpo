import {
	registerAsyncHandler,
	registerHandler,
} from "../../node-executor-utils";
import * as dateTimeNodes from "@impoexpo/shared/nodes/builtin/date-time";

registerHandler(dateTimeNodes.SET_DATETIME_LOCALE_NODE, (ctx) => {
	return { result: ctx.dateTime.setLocale(ctx.locale) };
});

registerHandler(dateTimeNodes.SET_DATETIME_TIMEZONE_NODE, (ctx) => {
	return { result: ctx.dateTime.setZone(ctx.timezone) };
});

registerHandler(dateTimeNodes.FORMAT_DATETIME_AUTO_NODE, (ctx) => {
	return {
		result: ctx.dateTime.toLocaleString(
			dateTimeNodes.DATETIME_FORMAT_PRESETS[ctx.preset],
		),
	};
});
