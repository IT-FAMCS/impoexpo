import {
	registerAsyncHandler,
	registerHandler,
} from "../../node-handler-utils";
import * as arrayNodes from "@impoexpo/shared/nodes/builtin/array";

registerHandler(arrayNodes.ARRAY_LENGTH_NODE, (ctx) => ({
	length: ctx.array.length,
}));

registerAsyncHandler(arrayNodes.ARRAY_FOREACH_NODE, async (ctx) => {
	for (const object of ctx.array) {
		await ctx["~run"](ctx.flow ?? [], { object });
	}
});
