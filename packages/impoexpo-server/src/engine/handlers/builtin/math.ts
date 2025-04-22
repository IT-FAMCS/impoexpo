import { registerHandler } from "../../node-handler-types";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";

registerHandler(mathNodes.ABS_NODE, (job, data) => {
	return { out: Math.abs(data.in) };
});
