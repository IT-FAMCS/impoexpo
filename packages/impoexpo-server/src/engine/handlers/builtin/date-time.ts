import { DateTime } from "luxon";
import { registerHandler } from "../../node-executor-utils";
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

registerHandler(dateTimeNodes.CURRENT_DATETIME_NODE, (ctx) => ({
	result: DateTime.now(),
}));

registerHandler(dateTimeNodes.DATE_IN_RANGE_NODE, (ctx) => {
	return {
		result:
			ctx.date >= (ctx.start ?? ctx.date) && ctx.date <= (ctx.end ?? ctx.date),
	};
});
