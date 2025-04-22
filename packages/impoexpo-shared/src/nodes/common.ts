import { object } from "valibot";
import { type ObjectEntry, BaseNode } from "./node-types";

export const binaryNode = <TIn extends ObjectEntry>(
	category: string,
	name: string,
	inType: () => TIn,
) =>
	new BaseNode({
		name: name,
		category: category,
		inputSchema: object({
			inA: inType(),
			inB: inType(),
		}),
		outputSchema: object({
			out: inType(),
		}),
	});

export const binaryNodeWithDifferentOutput = <
	TIn extends ObjectEntry,
	TOut extends ObjectEntry,
>(
	category: string,
	name: string,
	inType: () => TIn,
	outType: () => TOut,
) =>
	new BaseNode({
		name: name,
		category: category,
		inputSchema: object({
			inA: inType(),
			inB: inType(),
		}),
		outputSchema: object({
			out: outType(),
		}),
	});

export const unaryNode = <TIn extends ObjectEntry>(
	category: string,
	name: string,
	inType: () => TIn,
) =>
	new BaseNode({
		name: name,
		category: category,
		inputSchema: object({
			in: inType(),
		}),
		outputSchema: object({
			out: inType(),
		}),
	});

export const unaryNodeWithDifferentOutput = <
	TIn extends ObjectEntry,
	TOut extends ObjectEntry,
>(
	category: string,
	name: string,
	inType: () => TIn,
	outType: () => TOut,
) =>
	new BaseNode({
		name: name,
		category: category,
		inputSchema: object({
			in: inType(),
		}),
		outputSchema: object({
			out: outType(),
		}),
	});
