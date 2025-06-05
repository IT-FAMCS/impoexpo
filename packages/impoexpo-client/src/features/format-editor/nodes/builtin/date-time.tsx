import { nodesScope } from "@impoexpo/shared/nodes/node-database";
import {
	registerCategory,
	registerWithDefaultRenderer,
} from "../renderable-node-database";
import { msg } from "@lingui/core/macro";
import { Icon } from "@iconify/react";
import ISO6391 from "iso-639-1";
import { DateTime } from "luxon";
import * as dateTimeNodes from "@impoexpo/shared/nodes/builtin/date-time";
import type { NodePropertyOptionsMetadata } from "../renderable-node-types";

nodesScope(() => {
	registerCategory("date-time", {
		name: msg`date & time`,
		header: "bg-secondary-200",
		icon: (size) => <Icon width={size} icon="mdi:calendar" />,
	});

	const date = DateTime.now();
	const localeOptions: Record<string, NodePropertyOptionsMetadata<string>> = {};
	const timezoneOptions: Record<
		string,
		NodePropertyOptionsMetadata<string>
	> = {};
	const presetOptions: Record<string, NodePropertyOptionsMetadata<string>> = {};

	for (const code of ISO6391.getAllCodes()) {
		localeOptions[code] = {
			key: code,
			title: `${ISO6391.getNativeName(code)} (${ISO6391.getName(code)})`,
			description: date.setLocale(code).toLocaleString(DateTime.DATETIME_SHORT),
		};
	}

	for (const timezone of Intl.supportedValuesOf("timeZone")) {
		const [area, city] = timezone.split("/");
		timezoneOptions[timezone] = {
			key: timezone,
			title: `${area} -> ${city}`,
			description: date
				.setZone(timezone)
				.toLocaleString(DateTime.TIME_24_WITH_SHORT_OFFSET),
		};
	}

	for (const [key, formatter] of Object.entries(
		dateTimeNodes.DATETIME_FORMAT_PRESETS,
	)) {
		presetOptions[key] = {
			key,
			title: date.toLocaleString(formatter),
		};
	}

	registerWithDefaultRenderer(dateTimeNodes.SET_DATETIME_LOCALE_NODE, {
		title: msg`set locale`,
		aliases: msg`change country, change locale`,
		inputs: {
			dateTime: { title: msg`date` },
			locale: {
				title: msg`locale`,
				description: "",
				options: localeOptions,
				showLabel: true,
			},
		},
	});

	registerWithDefaultRenderer(dateTimeNodes.SET_DATETIME_TIMEZONE_NODE, {
		title: msg`set time zone`,
		aliases: msg`shift date, shift time, change time zone`,
		inputs: {
			dateTime: { title: msg`date` },
			timezone: {
				title: msg`time zone`,
				description: "",
				options: timezoneOptions,
				showLabel: true,
			},
		},
	});

	registerWithDefaultRenderer(dateTimeNodes.FORMAT_DATETIME_AUTO_NODE, {
		title: msg`date -> string (preset)`,
		aliases: msg`convert date to string, format date to string`,
		inputs: {
			dateTime: { title: msg`date` },
			preset: {
				title: msg`preset`,
				description: "",
				options: presetOptions,
				showLabel: true,
				mode: "independentOnly",
			},
		},
	});

	registerWithDefaultRenderer(dateTimeNodes.CURRENT_DATETIME_NODE, {
		title: msg`current date`,
		aliases: msg`now, current time`,
		outputs: {
			result: {
				title: msg`result`,
				description: msg`only use this node to get the current date, not the precise time!`,
			},
		},
	});

	registerWithDefaultRenderer(dateTimeNodes.GROUP_BY_DATETIME_NODE, {
		title: msg`group by date`,
		aliases: msg`group by time`,
		inputs: {
			date: { title: msg`date` },
			sortMethod: {
				title: msg`sorting method`,
				description: "",
				showLabel: true,
				mode: "independentOnly",
				options: {
					ascending: {
						title: msg`in ascending order (from earliest to latest)`,
					},
					descending: {
						title: msg`in descending order (from latest to earliest)`,
					},
				},
			},
			key: { title: msg`key` },
			value: { title: msg`value` },
		},
	});
});
