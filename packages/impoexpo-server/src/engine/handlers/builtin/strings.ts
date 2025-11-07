import { registerHandler } from "../../node-executor-utils";
import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";

registerHandler(stringNodes.CONTAINS_NODE, (ctx) => ({
	result: new RegExp(ctx.regex, "gmu").test(ctx.string),
}));

registerHandler(stringNodes.JOIN_STRINGS_NODE, (ctx) => ({
	result: ctx.strings.join(ctx.delimiter ?? ""),
}));

registerHandler(stringNodes.FORMAT_STRING_NODE, (ctx) => ({
	result: ctx.template.replace(/{(\d+)}/g, (match, idx) =>
		typeof ctx.args[idx] !== "undefined" ? ctx.args[idx] : match,
	),
}));

registerHandler(stringNodes.LENGTH_NODE, (ctx) => ({
	length: ctx.string.length,
}));

registerHandler(stringNodes.REPLACE_NODE, (ctx) => ({
	result: ctx.string.replaceAll(new RegExp(ctx.regex, "gmu"), ctx.replacement),
}));

registerHandler(stringNodes.SPLIT_STRING_NODE, (ctx) => ({
	parts: ctx.string.split(new RegExp(ctx.regex, "gmu")),
}));

registerHandler(stringNodes.TRIM_STRING_NODE, (ctx) => {
	let result = ctx.string;
	if (ctx.trimStart) result = result.trimStart();
	if (ctx.trimEnd) result = result.trimEnd();
	return { result };
});

registerHandler(stringNodes.FIND_NODE, (ctx) => {
	const match = ctx.string.match(ctx.regex);
	return { match: match?.[0] ?? null };
});
