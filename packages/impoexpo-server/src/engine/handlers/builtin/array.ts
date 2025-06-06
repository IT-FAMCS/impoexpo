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

registerHandler(arrayNodes.ARRAY_IS_FIRST_NODE, (ctx) => {
	const iterators = ctx["~iterators"]();
	return { first: iterators ? iterators[0].index === 0 : false };
});

registerHandler(arrayNodes.ARRAY_IS_LAST_NODE, (ctx) => {
	const iterators = ctx["~iterators"]();
	return {
		last: iterators ? iterators[0].index === iterators[0].length - 1 : false,
	};
});
