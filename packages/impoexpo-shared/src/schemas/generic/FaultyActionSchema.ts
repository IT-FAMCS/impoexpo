import {
	object,
	pipe,
	string,
	nonEmpty,
	email,
	url,
	number,
	type InferOutput,
	boolean,
	optional,
} from "valibot";

export const FaultyActionSchema = object({
	ok: boolean(),
	internal: optional(boolean(), true),
	error: optional(pipe(string(), nonEmpty())),
});

export type FaultyAction = InferOutput<typeof FaultyActionSchema>;
