import {
	object,
	pipe,
	string,
	nonEmpty,
	boolean,
	optional,
	type InferInput,
	type InferOutput,
} from "valibot";

export const FaultyActionSchema = object({
	ok: boolean(),
	internal: optional(boolean(), true),
	error: optional(pipe(string(), nonEmpty())),
});

export type FaultyActionInput = InferInput<typeof FaultyActionSchema>;
export type FaultyAction = InferOutput<typeof FaultyActionSchema>;
