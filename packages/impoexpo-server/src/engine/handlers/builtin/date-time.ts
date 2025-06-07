import { DateTime } from "luxon";
import {
	registerAsyncHandler,
	registerHandler,
} from "../../node-executor-utils";
import * as dateTimeNodes from "@impoexpo/shared/nodes/builtin/date-time";
import { logger } from "../../../logger";

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

registerAsyncHandler(dateTimeNodes.GROUP_BY_DATETIME_NODE, async (ctx) => {
	const groups = await ctx["~reduce"]<Map<number, [unknown, unknown[]]>>(
		(acc, cur) => {
			const group = acc.get(cur.date.toUnixInteger());
			acc.set(
				cur.date.toUnixInteger(),
				group ? [group[0], [...group[1], cur.value]] : [cur.key, [cur.value]],
			);
			return acc;
		},
		new Map(),
	);

	const sortedGroups = Array.from(groups.entries())
		.sort((a, b) => (a[0] > b[0] ? 1 : b[0] > a[0] ? -1 : 0))
		.map((g) => g[1]);
	if (ctx.sortMethod === "descending") sortedGroups.reverse();

	return { result: new Map(sortedGroups) };
});
