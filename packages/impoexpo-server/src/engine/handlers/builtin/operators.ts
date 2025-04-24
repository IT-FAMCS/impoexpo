import { registerHandler } from "../../node-handler-utils";
import * as operatorsNodes from "@impoexpo/shared/nodes/builtin/operators";

registerHandler(operatorsNodes.AND_NODE, (data) => ({
	out: data.inA && data.inB,
}));
registerHandler(operatorsNodes.EQUAL_NODE, (data) => ({
	out: data.inA === data.inB,
}));
registerHandler(operatorsNodes.GREATER_OR_EQUAL_TO_NODE, (data) => ({
	out: data.inA >= data.inB,
}));
registerHandler(operatorsNodes.GREATER_THAN_NODE, (data) => ({
	out: data.inA > data.inB,
}));
registerHandler(operatorsNodes.LESS_OR_EQUAL_TO_NODE, (data) => ({
	out: data.inA <= data.inB,
}));
registerHandler(operatorsNodes.LESS_THAN_NODE, (data) => ({
	out: data.inA < data.inB,
}));
registerHandler(operatorsNodes.NOT_NODE, (data) => ({ out: !data.in }));
registerHandler(operatorsNodes.OR_NODE, (data) => ({
	out: data.inA || data.inB,
}));
