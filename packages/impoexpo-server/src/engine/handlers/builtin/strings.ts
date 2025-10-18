import { registerHandler } from "../../node-executor-utils";
import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";

registerHandler(stringNodes.CONTAINS_NODE, (ctx) => ({
	result: ctx.string.includes(ctx.pattern),
}));

registerHandler(stringNodes.JOIN_STRINGS_NODE, (ctx) => ({
	result: ctx.strings.join(ctx.delimiter ?? ""),
}));

registerHandler(stringNodes.FORMAT_STRING_NODE, (ctx) => ({
	result: ctx.template.replace(/{(\d+)}/g, (match, idx) =>
		typeof ctx.args[idx] !== "undefined" ? `${ctx.args[idx]}` : match,
	),
}));

registerHandler(stringNodes.LENGTH_NODE, (ctx) => ({
	length: ctx.string.length,
}));

registerHandler(stringNodes.REPLACE_NODE, (ctx) => ({
	result: ctx.string.replaceAll(ctx.pattern, ctx.replacement),
}));

registerHandler(stringNodes.SPLIT_STRING_NODE, (ctx) => ({
	parts: ctx.string.split(ctx.delimiter),
}));

registerHandler(stringNodes.TRIM_STRING_NODE, (ctx) => {
	let result = ctx.string;
	if (ctx.trimStart) result = result.trimStart();
	if (ctx.trimEnd) result = result.trimEnd();
	return { result };
});
