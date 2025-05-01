import { registerHandler } from "../../node-handler-utils";
import * as arrayNodes from "@impoexpo/shared/nodes/builtin/array";

registerHandler(arrayNodes.ARRAY_LENGTH_NODE, (ctx) => ({
	length: ctx.array.length,
}));

registerHandler(arrayNodes.ARRAY_FOREACH_NODE, (ctx) =>
	ctx.array.map((object) => ({ object })),
);
