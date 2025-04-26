import { registerHandler } from "../../node-handler-utils";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";

registerHandler(mathNodes.ABS_NODE, (data) => ({ result: Math.abs(data.in) }));
registerHandler(mathNodes.ADD_NODE, (data) => ({
	result: data.inA + data.inB,
}));
registerHandler(mathNodes.DIVIDE_NODE, (data) => ({
	result: data.inA / data.inB,
}));
registerHandler(mathNodes.LOG_NODE, (data) => ({
	result: Math.log10(data.in),
}));
registerHandler(mathNodes.MODULO_NODE, (data) => ({
	result: data.inA % data.inB,
}));
registerHandler(mathNodes.MULTIPLY_NODE, (data) => ({
	result: data.inA * data.inB,
}));
registerHandler(mathNodes.NEGATE_NODE, (data) => ({ result: -data.in }));
registerHandler(mathNodes.POWER_NODE, (data) => ({
	result: data.inA ** data.inB,
}));
registerHandler(mathNodes.SQUARE_ROOT_NODE, (data) => ({
	result: Math.sqrt(data.in),
}));
registerHandler(mathNodes.SUBTRACT_NODE, (data) => ({
	result: data.inA - data.inB,
}));
