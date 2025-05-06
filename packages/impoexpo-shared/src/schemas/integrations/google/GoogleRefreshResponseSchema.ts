import * as v from "valibot";

export const GoogleRefreshResponseSchema = v.object({
	tokens: v.pipe(v.string(), v.nonEmpty()),
});

export type GoogleRefreshResponse = v.InferOutput<
	typeof GoogleRefreshResponseSchema
>;
