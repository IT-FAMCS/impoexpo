import { BaseNode } from "../node-types";
import { nodesScope } from "../node-database";
import { registerBaseNodes } from "../node-database";
import * as v from "valibot";
import { registerConverter } from "../type-converters";
import { dateTime } from "../node-utils";
import { dateTimeFromAny } from "luxon-parser";

export const REPLACE_NODE = new BaseNode({
	category: "strings",
	name: "replace",
	inputSchema: v.object({
		string: v.string(),
		pattern: v.string(),
		replacement: v.string(),
	}),
	outputSchema: v.object({
		result: v.string(),
	}),
});

export const CONTAINS_NODE = new BaseNode({
	category: "strings",
	name: "contains",
	inputSchema: v.object({
		string: v.string(),
		pattern: v.string(),
	}),
	outputSchema: v.object({
		result: v.boolean(),
	}),
});

export const LENGTH_NODE = new BaseNode({
	category: "strings",
	name: "length",
	inputSchema: v.object({
		string: v.string(),
	}),
	outputSchema: v.object({
		length: v.number(),
	}),
});

export const JOIN_STRINGS_NODE = new BaseNode({
	category: "strings",
	name: "join",
	inputSchema: v.object({
		strings: v.array(v.string()),
		delimiter: v.optional(v.string(), ""),
	}),
	outputSchema: v.object({
		result: v.string(),
	}),
});

export const FORMAT_STRING_NODE = new BaseNode({
	category: "strings",
	name: "format",
	inputSchema: v.object({
		template: v.string(),
		args: v.array(v.union([v.string(), v.number(), v.boolean()])),
	}),
	outputSchema: v.object({
		result: v.string(),
	}),
});

export const SPLIT_STRING_NODE = new BaseNode({
	category: "strings",
	name: "split-string",
	inputSchema: v.object({
		string: v.string(),
		delimiter: v.string(),
	}),
	outputSchema: v.object({
		parts: v.array(v.string()),
	}),
});

export const TRIM_STRING_NODE = new BaseNode({
	category: "strings",
	name: "trim-string",
	inputSchema: v.object({
		string: v.string(),
		trimStart: v.optional(v.boolean(), true),
		trimEnd: v.optional(v.boolean(), true),
	}),
	outputSchema: v.object({
		result: v.string(),
	}),
});

nodesScope(() => {
	registerBaseNodes(
		REPLACE_NODE,
		CONTAINS_NODE,
		LENGTH_NODE,
		JOIN_STRINGS_NODE,
		FORMAT_STRING_NODE,
		SPLIT_STRING_NODE,
		TRIM_STRING_NODE,
	);
	registerConverter(v.string(), v.nullable(v.number()), (obj) => {
		const num = Number(obj);
		return Number.isNaN(num) ? null : num;
	});
	registerConverter(v.string(), v.nullable(dateTime()), (obj) => {
		const result = dateTimeFromAny(obj);
		return result.isValid ? result : null;
	});
	registerConverter(
		v.string(),
		v.boolean(),
		(obj) => obj.toLowerCase() === "true",
	);
});
