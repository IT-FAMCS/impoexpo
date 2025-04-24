import { registerHandler } from "../../node-handler-utils";
import * as mathNodes from "@impoexpo/shared/nodes/builtin/math";

registerHandler(mathNodes.ABS_NODE, (data) => {
	return { out: Math.abs(data.in) };
});
