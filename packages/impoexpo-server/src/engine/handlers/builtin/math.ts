import { registerHandler } from "../../node-handler-utils";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";

registerHandler(mathNodes.ABS_NODE, (ctx) => ({ result: Math.abs(ctx.in) }));
registerHandler(mathNodes.ADD_NODE, (ctx) => ({
	result: ctx.inA + ctx.inB,
}));
registerHandler(mathNodes.DIVIDE_NODE, (ctx) => ({
	result: ctx.inA / ctx.inB,
}));
registerHandler(mathNodes.LOG_NODE, (ctx) => ({
	result: Math.log10(ctx.in),
}));
registerHandler(mathNodes.MODULO_NODE, (ctx) => ({
	result: ctx.inA % ctx.inB,
}));
registerHandler(mathNodes.MULTIPLY_NODE, (ctx) => ({
	result: ctx.inA * ctx.inB,
}));
registerHandler(mathNodes.NEGATE_NODE, (ctx) => ({ result: -ctx.in }));
registerHandler(mathNodes.POWER_NODE, (ctx) => ({
	result: ctx.inA ** ctx.inB,
}));
registerHandler(mathNodes.SQUARE_ROOT_NODE, (ctx) => ({
	result: Math.sqrt(ctx.in),
}));
registerHandler(mathNodes.SUBTRACT_NODE, (ctx) => ({
	result: ctx.inA - ctx.inB,
}));
