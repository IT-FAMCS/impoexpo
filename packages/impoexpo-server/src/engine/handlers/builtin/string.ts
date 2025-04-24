import { registerHandler } from "../../node-handler-utils";
import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";

registerHandler(stringNodes.CONTAINS_NODE, (data) => ({
	out: data.string.includes(data.pattern),
}));

registerHandler(stringNodes.JOIN_STRINGS_NODE, (data) => ({
	out: data.stringA + data.delimiter + data.stringB,
}));

registerHandler(stringNodes.LENGTH_NODE, (data) => ({
	out: data.string.length,
}));

registerHandler(stringNodes.NUMBER_TO_STRING_NODE, (data) => ({
	out: data.number.toString(),
}));

registerHandler(stringNodes.REPLACE_NODE, (data) => ({
	out: data.string.replaceAll(data.pattern, data.replacement),
}));
