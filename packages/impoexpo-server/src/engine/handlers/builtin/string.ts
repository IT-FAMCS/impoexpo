import { registerHandler } from "../../node-executor-utils";
import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";

registerHandler(stringNodes.CONTAINS_NODE, (ctx) => ({
	result: ctx.string.includes(ctx.pattern),
}));

registerHandler(stringNodes.JOIN_STRINGS_NODE, (ctx) => ({
	result: ctx.stringA + ctx.delimiter + ctx.stringB,
}));

registerHandler(stringNodes.LENGTH_NODE, (ctx) => ({
	length: ctx.string.length,
}));

registerHandler(stringNodes.NUMBER_TO_STRING_NODE, (ctx) => ({
	string: ctx.number.toString(),
}));

registerHandler(stringNodes.REPLACE_NODE, (ctx) => ({
	result: ctx.string.replaceAll(ctx.pattern, ctx.replacement),
}));

registerHandler(stringNodes.STRING_TO_NUMBER_NODE, (ctx) => ({
	number: Number.isNaN(Number.parseInt(ctx.string))
		? null
		: Number.parseInt(ctx.string),
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
