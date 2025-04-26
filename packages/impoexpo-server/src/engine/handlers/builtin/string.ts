import { registerHandler } from "../../node-handler-utils";
import * as stringNodes from "@impoexpo/shared/nodes/builtin/strings";

registerHandler(stringNodes.CONTAINS_NODE, (data) => ({
	result: data.string.includes(data.pattern),
}));

registerHandler(stringNodes.JOIN_STRINGS_NODE, (data) => ({
	result: data.stringA + data.delimiter + data.stringB,
}));

registerHandler(stringNodes.LENGTH_NODE, (data) => ({
	length: data.string.length,
}));

registerHandler(stringNodes.NUMBER_TO_STRING_NODE, (data) => ({
	string: data.number.toString(),
}));

registerHandler(stringNodes.REPLACE_NODE, (data) => ({
	result: data.string.replaceAll(data.pattern, data.replacement),
}));

registerHandler(stringNodes.STRING_TO_NUMBER_NODE, (data) => ({
	number: Number.isNaN(Number.parseInt(data.string))
		? null
		: Number.parseInt(data.string),
}));

registerHandler(stringNodes.SPLIT_STRING_NODE, (data) => ({
	parts: data.string.split(data.delimiter),
}));
