// adapted from https://github.com/Alwatr/nanolib/blob/next/packages/parse-duration/src/main.ts

const unitConversion = {
	second: 1000,
	seconds: 1000,
	minute: 60000,
	minutes: 60000,
	hour: 3600000,
	hours: 3600000,
	day: 86400000,
	days: 86400000,
	week: 604800000,
	weeks: 604800000,
	month: 2592000000,
	months: 2592000000,
	year: 31536000000,
	years: 31536000000,
} as const;

export type DurationUnit = keyof typeof unitConversion;
export type Duration = `${number} ${DurationUnit}` | number;

export const parseDuration = (duration: Duration): number => {
	let ms: number;

	if (typeof duration === "number") {
		ms = duration;
	} else {
		const split = duration.split(" ");
		const numberSubstring = split[0];

		if (Number.isNaN(Number(numberSubstring))) {
			throw new Error(`expected a number in duration: ${duration}`);
		}
		const durationNumber = +numberSubstring;
		const durationUnit = split[1] as DurationUnit;
		const unitConversionFactor = unitConversion[durationUnit];
		if (unitConversionFactor === undefined) {
			throw new Error(`invalud unit found in duration: ${duration}`);
		}
		ms = durationNumber * unitConversionFactor;
	}

	return ms;
};
