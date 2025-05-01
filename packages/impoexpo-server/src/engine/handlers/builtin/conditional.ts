import {
	registerAsyncHandler,
	registerHandler,
} from "../../node-handler-utils";
import * as conditionalNodes from "@impoexpo/shared/nodes/builtin/conditional";

registerHandler(conditionalNodes.IF_NODE, (ctx) => ({
	value: ctx.condition ? ctx.trueValue : ctx.falseValue,
}));

registerAsyncHandler(conditionalNodes.EXECUTE_IF_NODE, async (ctx) => {
	if (ctx.condition && ctx.trueFlow) await ctx["~run"](ctx.trueFlow);
	else if (ctx.falseFlow) await ctx["~run"](ctx.falseFlow);
});

registerAsyncHandler(conditionalNodes.REPEAT_NODE, async (ctx) => {
	const result: { iteration: number }[] = [];
	for (let i = 1; i <= ctx.times; i++) {
		if (ctx.flow) await ctx["~run"](ctx.flow, { iteration: i });
		result.push({ iteration: i });
	}
	// since the iteration field can be assigned to any node,
	// the repeat node will behave like an iterator to nodes which aren't in the flow
	return result;
});

registerHandler(conditionalNodes.THROW_ERROR_IF_NULL_NODE, (ctx) => {
	if (ctx.nullableObject === null || ctx.nullableObject === undefined) {
		throw new Error(ctx.errorMessage);
	}
	return { object: ctx.nullableObject };
});
