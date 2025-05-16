import {
	registerAsyncHandler,
	registerHandler,
} from "../../node-executor-utils";
import * as arrayNodes from "@impoexpo/shared/nodes/builtin/array";

registerHandler(arrayNodes.ARRAY_LENGTH_NODE, (ctx) => ({
	length: ctx.array.length,
}));

registerAsyncHandler(arrayNodes.ARRAY_FOREACH_NODE, async (ctx) => {
	return ctx.array.map((object) => ({ object }));
});
