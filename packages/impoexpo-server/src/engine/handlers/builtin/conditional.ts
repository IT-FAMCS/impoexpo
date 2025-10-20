import { registerHandler } from "../../node-executor-utils";
import * as conditionalNodes from "@impoexpo/shared/nodes/builtin/conditional";

registerHandler(conditionalNodes.IF_NODE, (ctx) => ({
	value: ctx.condition ? ctx.trueValue : ctx.falseValue,
}));

registerHandler(conditionalNodes.REPEAT_NODE, (ctx) => {
	return Array.from({ length: ctx.times }, (_, i) => ({
		iteration: i + 1,
	}));
});

registerHandler(conditionalNodes.THROW_ERROR_IF_NULL_NODE, (ctx) => {
	if (ctx.nullableObject === null || ctx.nullableObject === undefined) {
		throw new Error(ctx.errorMessage);
	}
	return { object: ctx.nullableObject };
});

registerHandler(conditionalNodes.SKIP_ITERATION_IF_NODE, (ctx) => {
	const { skip } = ctx["~iterators"]();
	if (ctx.condition) skip();
	return { sameObj: ctx.obj };
});
