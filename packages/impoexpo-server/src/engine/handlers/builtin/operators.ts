import { registerHandler } from "../../node-handler-utils";
import * as operatorsNodes from "@impoexpo/shared/nodes/builtin/operators";

registerHandler(operatorsNodes.AND_NODE, (ctx) => ({
	result: ctx.inA && ctx.inB,
}));
registerHandler(operatorsNodes.EQUAL_NODE, (ctx) => ({
	result: ctx.inA === ctx.inB,
}));
registerHandler(operatorsNodes.GREATER_OR_EQUAL_TO_NODE, (ctx) => ({
	result: ctx.inA >= ctx.inB,
}));
registerHandler(operatorsNodes.GREATER_THAN_NODE, (ctx) => ({
	result: ctx.inA > ctx.inB,
}));
registerHandler(operatorsNodes.LESS_OR_EQUAL_TO_NODE, (ctx) => ({
	result: ctx.inA <= ctx.inB,
}));
registerHandler(operatorsNodes.LESS_THAN_NODE, (ctx) => ({
	result: ctx.inA < ctx.inB,
}));
registerHandler(operatorsNodes.NOT_NODE, (ctx) => ({ result: !ctx.in }));
registerHandler(operatorsNodes.OR_NODE, (ctx) => ({
	result: ctx.inA || ctx.inB,
}));
