import * as v from "valibot";

export const FaultyActionSchema = v.required(
	v.object({
		ok: v.boolean(),
		internal: v.optional(v.boolean()),
		error: v.optional(v.string()),
	}),
	["ok"],
);

export type FaultyAction = v.InferOutput<typeof FaultyActionSchema>;
