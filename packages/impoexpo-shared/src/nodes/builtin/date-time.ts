import * as v from "valibot";
import { BaseNode } from "../node-types";
import { nodesScope, registerBaseNodes } from "../node-database";
import { dateTime, generic } from "../node-utils";
import ISO6391 from "iso-639-1";
import { DateTime } from "luxon";

// i hate my life
export const DATETIME_FORMAT_PRESETS: Record<
	string,
	Intl.DateTimeFormatOptions
> = {
	DATE_SHORT: DateTime.DATE_SHORT,
	DATE_MED: DateTime.DATE_MED,
	DATE_MED_WITH_WEEKDAY: DateTime.DATE_MED_WITH_WEEKDAY,
	DATE_FULL: DateTime.DATE_FULL,
	DATE_HUGE: DateTime.DATE_HUGE,
	TIME_SIMPLE: DateTime.TIME_SIMPLE,
	TIME_WITH_SECONDS: DateTime.TIME_WITH_SECONDS,
	TIME_WITH_SHORT_OFFSET: DateTime.TIME_WITH_SHORT_OFFSET,
	TIME_WITH_LONG_OFFSET: DateTime.TIME_WITH_LONG_OFFSET,
	TIME_24_SIMPLE: DateTime.TIME_24_SIMPLE,
	TIME_24_WITH_SECONDS: DateTime.TIME_24_WITH_SECONDS,
	TIME_24_WITH_SHORT_OFFSET: DateTime.TIME_24_WITH_SHORT_OFFSET,
	TIME_24_WITH_LONG_OFFSET: DateTime.TIME_24_WITH_LONG_OFFSET,
	DATETIME_SHORT: DateTime.DATETIME_SHORT,
	DATETIME_MED: DateTime.DATETIME_MED,
	DATETIME_MED_WITH_WEEKDAY: DateTime.DATETIME_MED_WITH_WEEKDAY,
	DATETIME_FULL: DateTime.DATETIME_FULL,
	DATETIME_HUGE: DateTime.DATETIME_HUGE,
	DATETIME_SHORT_WITH_SECONDS: DateTime.DATETIME_SHORT_WITH_SECONDS,
	DATETIME_MED_WITH_SECONDS: DateTime.DATETIME_MED_WITH_SECONDS,
	DATETIME_FULL_WITH_SECONDS: DateTime.DATETIME_FULL_WITH_SECONDS,
	DATETIME_HUGE_WITH_SECONDS: DateTime.DATETIME_HUGE_WITH_SECONDS,
};

export const SET_DATETIME_TIMEZONE_NODE = new BaseNode({
	category: "date-time",
	name: "set-timezone",
	inputSchema: v.object({
		dateTime: dateTime(),
		timezone: v.picklist(Intl.supportedValuesOf("timeZone")),
	}),
	outputSchema: v.object({
		result: dateTime(),
	}),
});

export const SET_DATETIME_LOCALE_NODE = new BaseNode({
	category: "date-time",
	name: "set-locale",
	inputSchema: v.object({
		dateTime: dateTime(),
		locale: v.picklist(ISO6391.getAllCodes()),
	}),
	outputSchema: v.object({
		result: dateTime(),
	}),
});

export const FORMAT_DATETIME_AUTO_NODE = new BaseNode({
	category: "date-time",
	name: "format-auto",
	inputSchema: v.object({
		dateTime: dateTime(),
		preset: v.picklist(Object.keys(DATETIME_FORMAT_PRESETS)),
	}),
	outputSchema: v.object({
		result: v.string(),
	}),
});

export const GROUP_BY_DATETIME_NODE = new BaseNode({
	category: "date-time",
	name: "group-by",
	inputSchema: v.object({
		date: dateTime(),
		sortMethod: v.optional(
			v.picklist(["ascending", "descending"]),
			"ascending",
		),
		key: generic("TKey"),
		value: generic("TValue"),
	}),
	outputSchema: v.object({
		result: v.map(generic("TKey"), v.array(generic("TValue"))),
	}),
});

export const CURRENT_DATETIME_NODE = new BaseNode({
	category: "date-time",
	name: "current",
	outputSchema: v.object({
		result: dateTime(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		SET_DATETIME_LOCALE_NODE,
		SET_DATETIME_TIMEZONE_NODE,
		FORMAT_DATETIME_AUTO_NODE,
		GROUP_BY_DATETIME_NODE,
		CURRENT_DATETIME_NODE,
	);
});
