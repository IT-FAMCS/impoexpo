import {
	registerAsyncHandler,
	registerHandler,
} from "../../node-handler-utils";
import * as conditionalNodes from "@impoexpo/shared/nodes/builtin/conditional";

registerHandler(conditionalNodes.IF_NODE, (ctx) => ({
	value: ctx.condition ? ctx.trueValue : ctx.falseValue,
}));

registerAsyncHandler(conditionalNodes.EXECUTE_IF_NODE, async (ctx) => {
	if (ctx.condition && ctx.trueFlow) await ctx["~run"]("trueFlow");
	else if (ctx.falseFlow) await ctx["~run"]("falseFlow");
});

registerAsyncHandler(conditionalNodes.REPEAT_NODE, async (ctx) => {
	for (let i = 1; i <= ctx.times; i++) {
		if (ctx.flow) await ctx["~run"]("flow", { iteration: i });
	}
});

registerHandler(conditionalNodes.RETURN_NODE, (ctx) => {
	ctx["~return"](ctx.value);
});

registerHandler(conditionalNodes.THROW_ERROR_IF_NULL_NODE, (ctx) => {
	if (ctx.nullableObject === null || ctx.nullableObject === undefined) {
		throw new Error(ctx.errorMessage);
	}
	return { object: ctx.nullableObject };
});
