import { object } from "valibot";
import { type ObjectEntry, BaseNode } from "./node-types";

export const symmetricBinaryNode = (
	category: string,
	name: string,
	inType: () => ObjectEntry,
	outType?: () => ObjectEntry,
) =>
	new BaseNode({
		name: name,
		category: category,
		inputSchema: object({
			inA: inType(),
			inB: inType(),
		}),
		outputSchema: object({
			out: (outType ?? inType)(),
		}),
	});

export const symmetricUnaryNode = (
	category: string,
	name: string,
	inType: () => ObjectEntry,
	outType?: () => ObjectEntry,
) =>
	new BaseNode({
		name: name,
		category: category,
		inputSchema: object({
			in: inType(),
		}),
		outputSchema: object({
			out: (outType ?? inType)(),
		}),
	});
