import { registerHandler } from "../../node-handler-utils";
import * as conditionalNodes from "@impoexpo/shared/nodes/builtin/conditional";

registerHandler(conditionalNodes.IF_NODE, (data) => ({
	out: data.condition ? data.trueValue : data.falseValue,
}));

registerHandler(conditionalNodes.THROW_ERROR_IF_NULL_NODE, (data, job) => {
	if (data.nullableObject === null || data.nullableObject === undefined) {
		throw new Error(data.errorMessage);
	}
	return { object: data.nullableObject };
});
