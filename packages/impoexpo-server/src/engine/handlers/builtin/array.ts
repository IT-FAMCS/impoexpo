import { registerHandler } from "../../node-handler-utils";
import * as arrayNodes from "@impoexpo/shared/nodes/builtin/array";

registerHandler(arrayNodes.ARRAY_LENGTH_NODE, (data) => ({
	length: data.array.length,
}));

registerHandler(arrayNodes.ARRAY_FOREACH_NODE, (data) =>
	data.array.map((object) => ({ object })),
);
