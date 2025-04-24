import { registerHandler } from "../../node-handler-utils";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";

registerHandler(mathNodes.ABS_NODE, (data) => ({ out: Math.abs(data.in) }));
registerHandler(mathNodes.ADD_NODE, (data) => ({ out: data.inA + data.inB }));
registerHandler(mathNodes.DIVIDE_NODE, (data) => ({
	out: data.inA / data.inB,
}));
registerHandler(mathNodes.LOG_NODE, (data) => ({ out: Math.log10(data.in) }));
registerHandler(mathNodes.MODULO_NODE, (data) => ({
	out: data.inA % data.inB,
}));
registerHandler(mathNodes.MULTIPLY_NODE, (data) => ({
	out: data.inA * data.inB,
}));
registerHandler(mathNodes.NEGATE_NODE, (data) => ({ out: -data.in }));
registerHandler(mathNodes.POWER_NODE, (data) => ({
	out: data.inA ** data.inB,
}));
registerHandler(mathNodes.SQUARE_ROOT_NODE, (data) => ({
	out: Math.sqrt(data.in),
}));
registerHandler(mathNodes.SUBTRACT_NODE, (data) => ({
	out: data.inA - data.inB,
}));
